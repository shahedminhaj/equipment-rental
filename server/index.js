import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { MongoClient, ObjectId } from "mongodb";
import Stripe from "stripe";
import cron from "node-cron";
import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";

const required = ["MONGODB_URI", "JWT_SECRET"];
for (const name of required) {
  if (!process.env[name]) throw new Error(`${name} is required`);
}
if (process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET.includes("replace-with")) throw new Error("JWT_SECRET must be a unique random value of at least 32 characters");

const port = Number(process.env.PORT || 5000);
const dbName = process.env.MONGODB_DB || "fieldkit";
const currency = (process.env.STRIPE_CURRENCY || "bdt").toLowerCase();
const categoryTaxonomy = [
  "Construction Equipment",
  "Photography Equipment",
  "Vehicles & Transportation",
  "Agriculture Equipment",
  "Electronics",
  "Event Equipment",
];
const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
const allowedOrigins = (process.env.ALLOWED_ORIGINS || frontendUrl)
  .split(",").map((origin) => origin.trim()).filter(Boolean);
const client = new MongoClient(process.env.MONGODB_URI);
const app = express();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
let db;
let users;
let equipment;
let bookings;
let payments;
let favorites;
let reviews;

const cleanUser = (user) => ({
  id: String(user._id), name: user.name, email: user.email, role: user.role,
  photo: user.photo || "", phone: user.phone || "", address: user.address || "",
  createdAt: user.createdAt, disabled: Boolean(user.disabled),
});
const idOf = (value) => String(value?._id || value || "");
const toObjectId = (value) => ObjectId.isValid(value) ? new ObjectId(value) : null;
const publicEquipment = (item) => item && ({
  id: idOf(item._id), name: item.name, description: item.description, category: item.category,
  location: item.location, price: item.price, rentalType: item.rentalType,
  availableQuantity: item.availableQuantity, image: item.image, condition: item.condition,
  brand: item.brand, model: item.model, rentalTerms: item.rentalTerms || [],
  status: item.status, createdAt: item.createdAt,
  owner: item.owner ? { name: item.owner.name, photo: item.owner.photo, email: item.owner.email } : null,
});
const publicBooking = (booking) => booking && ({
  id: idOf(booking._id), equipmentName: booking.equipmentName,
  rentalStartDate: booking.rentalStartDate, rentalEndDate: booking.rentalEndDate,
  createdAt: booking.createdAt, quantity: booking.quantity, totalAmount: booking.totalAmount,
  paymentStatus: booking.paymentStatus, bookingStatus: booking.bookingStatus,
  contactNumber: booking.contactNumber, deliveryAddress: booking.deliveryAddress,
  notes: booking.notes, equipment: booking.equipment ? {
    id: idOf(booking.equipment._id), name: booking.equipment.name,
    image: booking.equipment.image, location: booking.equipment.location,
  } : null,
  customer: booking.customer ? { name: booking.customer.name, email: booking.customer.email } : null,
  owner: booking.owner ? { name: booking.owner.name, email: booking.owner.email } : null,
});
const fail = (status, message) => Object.assign(new Error(message), { status });
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

function signToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}
function sendAuth(res, user, status = 200) {
  res.status(status).json({ token: signToken(user), user: cleanUser(user) });
}
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return res.status(401).json({ message: "Sign in to continue." });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (typeof payload === "string" || !ObjectId.isValid(payload.sub)) throw new Error("Invalid token");
    req.auth = { userId: new ObjectId(payload.sub), role: payload.role };
    next();
  } catch {
    return res.status(401).json({ message: "Your session is invalid or expired. Sign in again." });
  }
}
const requireRole = (...roles) => [verifyToken, asyncRoute(async (req, _res, next) => {
  const user = await users.findOne({ _id: req.auth.userId, disabled: { $ne: true } });
  if (!user) return next(fail(401, "Account not found or disabled."));
  req.user = user;
  if (!roles.includes(user.role)) return next(fail(403, "You do not have permission to do that."));
  next();
})];
const verifyRenter = requireRole("customer");
const verifyOwner = requireRole("owner");
const verifyAdmin = requireRole("admin");
const verifyAnyUser = requireRole("customer", "owner", "admin");

async function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  const existing = await users.findOne({ email });
  const passwordHash = await bcrypt.hash(password, 12);
  if (existing) {
    await users.updateOne({ _id: existing._id }, { $set: { role: "admin", passwordHash, disabled: false } });
  } else {
    await users.insertOne({ name: "Administrator", email, passwordHash, role: "admin", photo: "", phone: "", address: "", disabled: false, createdAt: new Date() });
  }
}

function rentalUnits(start, end, type) {
  const startTime = Date.parse(`${start}T00:00:00Z`);
  const endTime = Date.parse(`${end}T00:00:00Z`);
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime < startTime) return 0;
  if (new Date(startTime).toISOString().slice(0, 10) !== start || new Date(endTime).toISOString().slice(0, 10) !== end) return 0;
  const days = Math.max(1, Math.ceil((endTime - startTime) / 86400000));
  return type === "Weekly" ? Math.ceil(days / 7) : type === "Monthly" ? Math.ceil(days / 30) : days;
}
function pagination(query, defaultLimit = 12, maxLimit = 100) {
  const page = Math.max(1, Number.parseInt(query.page || "1", 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number.parseInt(query.limit || String(defaultLimit), 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}
function equipmentQuery(query) {
  const filter = { status: "approved" };
  const search = String(query.search || query.q || "").trim();
  if (search) filter.$or = ["name", "category", "location"].map((field) => ({ [field]: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }));
  if (query.category) filter.category = String(query.category);
  if (["Daily", "Weekly", "Monthly"].includes(query.rentalType)) filter.rentalType = query.rentalType;
  if (query.available === "true") filter.availableQuantity = { $gt: 0 };
  if (query.available === "false") filter.availableQuantity = { $lte: 0 };
  const price = {};
  if (Number.isFinite(Number(query.minPrice))) price.$gte = Number(query.minPrice);
  if (Number.isFinite(Number(query.maxPrice))) price.$lte = Number(query.maxPrice);
  if (Object.keys(price).length) filter.price = price;
  return filter;
}
function sortOrder(sort) {
  if (sort === "price-low" || sort === "price_asc") return { price: 1, createdAt: -1 };
  if (sort === "price-high" || sort === "price_desc") return { price: -1, createdAt: -1 };
  return { createdAt: -1 };
}
async function bookingAvailability(item, start, end, quantity, excludeId = null) {
  const criteria = { equipmentId: item._id, paymentStatus: { $in: ["paid", "pending"] }, bookingStatus: { $in: ["pending", "confirmed"] }, rentalStartDate: { $lte: end }, rentalEndDate: { $gte: start } };
  if (excludeId) criteria._id = { $ne: excludeId };
  const existing = await bookings.find(criteria).toArray();
  const reserved = existing.reduce((sum, item) => sum + item.quantity, 0);
  return reserved + quantity <= item.availableQuantity;
}
async function loadBooking(id) {
  return bookings.aggregate([
    { $match: { _id: id } },
    { $lookup: { from: "equipment", localField: "equipmentId", foreignField: "_id", as: "equipment" } }, { $unwind: { path: "$equipment", preserveNullAndEmptyArrays: true } },
    { $lookup: { from: "users", localField: "customerId", foreignField: "_id", as: "customer" } }, { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
    { $lookup: { from: "users", localField: "ownerId", foreignField: "_id", as: "owner" } }, { $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } },
  ]).next();
}
async function ensureBookingAccess(req, bookingId) {
  const booking = await bookings.findOne({ _id: bookingId });
  if (!booking) throw fail(404, "Booking not found.");
  const owns = String(booking.customerId) === String(req.user._id) || String(booking.ownerId) === String(req.user._id);
  if (req.user.role !== "admin" && !owns) throw fail(403, "You cannot access this booking.");
  return booking;
}
function emailTransport() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) return null;
  return nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: Number(process.env.SMTP_PORT) === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } });
}
async function notifyCompletion(booking) {
  const transport = emailTransport();
  if (!transport) return;
  const populated = await loadBooking(booking._id);
  const emails = [populated?.customer?.email, populated?.owner?.email].filter(Boolean);
  await Promise.all(emails.map((to) => transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER, to,
    subject: `Rental completed: ${booking.equipmentName}`,
    text: `Your rental of ${booking.equipmentName} (${booking.rentalStartDate} to ${booking.rentalEndDate}) is complete. Thank you for using Fieldkit.`,
  })));
}

// Stripe webhook must receive the raw request body before JSON parsing.
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), asyncRoute(async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) throw fail(503, "Stripe webhook is not configured.");
  let event;
  try { event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET); }
  catch { throw fail(400, "Invalid Stripe webhook signature."); }
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object;
    const bookingId = toObjectId(session.metadata?.bookingId);
    if (bookingId) {
      const current = await bookings.findOne({ _id: bookingId });
      if (current && ["cancelled", "rejected"].includes(current.bookingStatus) && session.payment_intent) {
        const refund = await stripe.refunds.create({ payment_intent: session.payment_intent });
        await bookings.updateOne({ _id: bookingId }, { $set: { paymentStatus: "refunded", stripePaymentIntentId: String(session.payment_intent), refundId: refund.id, updatedAt: new Date() } });
        await payments.updateOne({ bookingId }, { $set: { status: "refunded", transactionId: String(session.payment_intent), refundId: refund.id, updatedAt: new Date() } });
      } else {
        const updated = await bookings.findOneAndUpdate({ _id: bookingId, paymentStatus: "pending", bookingStatus: { $nin: ["cancelled", "rejected"] } }, { $set: { paymentStatus: "paid", stripePaymentIntentId: String(session.payment_intent || ""), paidAt: new Date(), updatedAt: new Date() } }, { returnDocument: "after" });
        if (updated) await payments.updateOne({ bookingId }, { $set: { status: "paid", transactionId: String(session.payment_intent || session.id), stripeSessionId: session.id, amount: updated.totalAmount, currency, updatedAt: new Date() }, $setOnInsert: { bookingId, customerId: updated.customerId, createdAt: new Date() } }, { upsert: true });
      }
    }
  }
  if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
    const bookingId = toObjectId(event.data.object.metadata?.bookingId);
    if (bookingId) {
      await bookings.updateOne({ _id: bookingId, paymentStatus: "pending" }, { $set: { paymentStatus: "failed", bookingStatus: "cancelled", updatedAt: new Date() } });
      await payments.updateOne({ bookingId }, { $set: { status: "failed", updatedAt: new Date() } });
    }
  }
  res.json({ received: true });
}));

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin(origin, callback) { if (!origin || allowedOrigins.includes(origin)) return callback(null, true); callback(fail(403, "Origin is not allowed by CORS.")); }, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 40, standardHeaders: "draft-7", legacyHeaders: false }));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.get("/api/auth/admin/setup-status", asyncRoute(async (_req, res) => {
  const total = await users.countDocuments({ role: "admin" });
  const configured = Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);
  res.json({ configured, available: configured && total === 0 });
}));
app.post("/api/auth/admin/setup", asyncRoute(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (password.length < 6 || !/[A-Z]/.test(password) || !/[a-z]/.test(password)) throw fail(400, "Password must have at least 6 characters, one uppercase letter, and one lowercase letter.");
  const adminExists = await users.countDocuments({ role: "admin" });
  const configuredMatch = process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && email === process.env.ADMIN_EMAIL.trim().toLowerCase() && password === process.env.ADMIN_PASSWORD;
  if (adminExists && !configuredMatch) throw fail(403, "Admin account is already configured.");
  if (process.env.ADMIN_EMAIL && email !== process.env.ADMIN_EMAIL.trim().toLowerCase()) throw fail(403, "Use the configured administrator email.");
  const user = await users.findOne({ email });
  if (user && user.role !== "admin" && !configuredMatch) throw fail(409, "This email is already registered.");
  const passwordHash = await bcrypt.hash(password, 12);
  const result = await users.findOneAndUpdate({ email }, { $set: { name: user?.name || "Administrator", email, passwordHash, role: "admin", disabled: false, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date(), photo: "", phone: "", address: "" } }, { upsert: true, returnDocument: "after" });
  sendAuth(res, result);
}));
app.post("/api/auth/register", asyncRoute(async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw fail(400, "Enter a valid name and email address.");
  if (password.length < 6 || !/[A-Z]/.test(password) || !/[a-z]/.test(password)) throw fail(400, "Password must have at least 6 characters, one uppercase letter, and one lowercase letter.");
  if (await users.findOne({ email })) throw fail(409, "An account with this email already exists.");
  const result = await users.insertOne({ name, email, passwordHash: await bcrypt.hash(password, 12), role: "customer", photo: String(req.body.photo || ""), phone: "", address: "", disabled: false, createdAt: new Date() });
  sendAuth(res, await users.findOne({ _id: result.insertedId }), 201);
}));
app.post("/api/auth/login", asyncRoute(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const user = await users.findOne({ email });
  if (!user || user.disabled || !await bcrypt.compare(String(req.body.password || ""), user.passwordHash || "")) throw fail(401, "Email or password is incorrect.");
  sendAuth(res, user);
}));
app.post("/api/auth/google", asyncRoute(async (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) throw fail(503, "Google sign-in is not configured.");
  const ticket = await googleClient.verifyIdToken({ idToken: String(req.body.credential || ""), audience: process.env.GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();
  if (!payload?.email || !payload.email_verified) throw fail(401, "Google account could not be verified.");
  const email = payload.email.toLowerCase();
  let user = await users.findOne({ email });
  if (user?.disabled) throw fail(403, "This account has been disabled.");
  if (!user) {
    const result = await users.insertOne({ name: payload.name || "Fieldkit customer", email, passwordHash: "", role: "customer", photo: payload.picture || "", phone: "", address: "", disabled: false, createdAt: new Date(), googleSubject: payload.sub });
    user = await users.findOne({ _id: result.insertedId });
  }
  sendAuth(res, user);
}));
app.get("/api/auth/me", ...verifyAnyUser, (req, res) => res.json({ user: cleanUser(req.user) }));

app.get("/api/profile", ...verifyAnyUser, (req, res) => res.json({ user: cleanUser(req.user) }));
app.patch("/api/profile", ...verifyAnyUser, asyncRoute(async (req, res) => {
  const update = {};
  for (const key of ["name", "photo", "phone", "address"]) if (typeof req.body[key] === "string") update[key] = req.body[key].trim();
  if (update.name !== undefined && update.name.length < 2) throw fail(400, "Name must be at least 2 characters.");
  update.updatedAt = new Date();
  await users.updateOne({ _id: req.user._id }, { $set: update });
  res.json({ user: cleanUser({ ...req.user, ...update }) });
}));

app.get("/api/equipment/categories", asyncRoute(async (_req, res) => {
  const counts = await equipment.aggregate([{ $match: { status: "approved" } }, { $group: { _id: "$category", count: { $sum: 1 } } }]).toArray();
  const countByName = new Map(counts.map((row) => [row._id, row.count]));
  const known = new Set(categoryTaxonomy);
  const items = [
    ...categoryTaxonomy.map((name) => ({ name, count: countByName.get(name) || 0 })),
    ...counts.filter((row) => !known.has(row._id)).map((row) => ({ name: row._id, count: row.count })),
  ].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  res.json({ items });
}));
app.get("/api/equipment/featured", asyncRoute(async (_req, res) => {
  const items = await equipment.find({ status: "approved" }).sort({ createdAt: -1 }).limit(6).toArray();
  res.json({ items: items.map(publicEquipment) });
}));
app.get("/api/equipment/owner/mine", ...verifyOwner, asyncRoute(async (req, res) => {
  const items = await equipment.find({ ownerId: req.user._id }).sort({ createdAt: -1 }).toArray();
  res.json({ items: items.map(publicEquipment) });
}));
app.get("/api/equipment", asyncRoute(async (req, res) => {
  const { page, limit, skip } = pagination(req.query, 9, 50);
  const filter = equipmentQuery(req.query);
  const [rows, total] = await Promise.all([equipment.find(filter).sort(sortOrder(req.query.sort)).skip(skip).limit(limit).toArray(), equipment.countDocuments(filter)]);
  res.json({ items: rows.map(publicEquipment), total, page, pages: Math.ceil(total / limit) });
}));
app.get("/api/equipment/:id", asyncRoute(async (req, res) => {
  const id = toObjectId(req.params.id);
  if (!id) throw fail(404, "Equipment not found.");
  const item = await equipment.findOne({ _id: id, status: "approved" });
  if (!item) throw fail(404, "Equipment not found.");
  const owner = await users.findOne({ _id: item.ownerId }, { projection: { name: 1, email: 1, photo: 1 } });
  res.json({ item: publicEquipment({ ...item, owner }) });
}));
app.post("/api/equipment", ...verifyOwner, asyncRoute(async (req, res) => {
  const body = req.body;
  const name = String(body.name || "").trim();
  const category = String(body.category || "").trim();
  const price = Number(body.price);
  const availableQuantity = Number(body.availableQuantity);
  const terms = Array.isArray(body.rentalTerms) ? body.rentalTerms : String(body.rentalTerms || "").split("\n").map((term) => term.trim()).filter(Boolean);
  if (name.length < 3 || !String(body.description || "").trim() || !category || !String(body.location || "").trim() || !String(body.image || "").trim() || !String(body.condition || "").trim() || !String(body.brand || "").trim() || !String(body.model || "").trim() || !terms.length || !Number.isFinite(price) || price <= 0 || !Number.isInteger(availableQuantity) || availableQuantity < 1 || !["Daily", "Weekly", "Monthly"].includes(body.rentalType)) throw fail(400, "Complete all required equipment fields with valid values.");
  const record = { name, description: String(body.description || "").trim(), category, location: String(body.location).trim(), price, rentalType: body.rentalType, availableQuantity, image: String(body.image).trim(), condition: String(body.condition).trim(), brand: String(body.brand).trim(), model: String(body.model).trim(), rentalTerms: terms, status: "pending", ownerId: req.user._id, owner: { name: req.user.name, photo: req.user.photo, email: req.user.email }, createdAt: new Date(), updatedAt: new Date() };
  const result = await equipment.insertOne(record);
  res.status(201).json({ item: publicEquipment({ ...record, _id: result.insertedId }) });
}));
app.patch("/api/equipment/:id", ...verifyAnyUser, asyncRoute(async (req, res) => {
  const id = toObjectId(req.params.id);
  if (!id) throw fail(404, "Equipment not found.");
  const item = await equipment.findOne({ _id: id });
  if (!item) throw fail(404, "Equipment not found.");
  if (req.user.role !== "admin" && String(item.ownerId) !== String(req.user._id)) throw fail(403, "You cannot update this listing.");
  const allowed = req.user.role === "admin" ? ["name", "description", "category", "location", "price", "rentalType", "availableQuantity", "image", "condition", "brand", "model", "rentalTerms"] : ["name", "description", "category", "location", "price", "rentalType", "availableQuantity", "image", "condition", "brand", "model", "rentalTerms"];
  const update = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  if (update.price !== undefined) update.price = Number(update.price);
  if (update.availableQuantity !== undefined) update.availableQuantity = Number(update.availableQuantity);
  update.updatedAt = new Date();
  await equipment.updateOne({ _id: id }, { $set: update });
  res.json({ item: publicEquipment({ ...item, ...update }) });
}));
app.delete("/api/equipment/:id", ...verifyAnyUser, asyncRoute(async (req, res) => {
  const id = toObjectId(req.params.id);
  if (!id) throw fail(404, "Equipment not found.");
  const item = await equipment.findOne({ _id: id });
  if (!item) throw fail(404, "Equipment not found.");
  if (req.user.role !== "admin" && String(item.ownerId) !== String(req.user._id)) throw fail(403, "You cannot delete this listing.");
  if (await bookings.countDocuments({ equipmentId: id, paymentStatus: "paid", bookingStatus: { $in: ["pending", "confirmed"] } })) throw fail(409, "This item has active rentals and cannot be deleted yet.");
  await equipment.deleteOne({ _id: id });
  await favorites.deleteMany({ equipmentId: id });
  res.status(204).end();
}));

app.get("/api/admin/equipment", ...verifyAdmin, asyncRoute(async (req, res) => {
  const { page, limit, skip } = pagination(req.query, 50, 100);
  const filter = {};
  if (["pending", "approved", "rejected"].includes(req.query.status)) filter.status = req.query.status;
  const [rows, total] = await Promise.all([equipment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(), equipment.countDocuments(filter)]);
  res.json({ items: rows.map(publicEquipment), total, page, pages: Math.ceil(total / limit) });
}));
app.patch("/api/admin/equipment/:id/status", ...verifyAdmin, asyncRoute(async (req, res) => {
  const id = toObjectId(req.params.id);
  const status = req.body.status;
  if (!id || !["pending", "approved", "rejected"].includes(status)) throw fail(400, "Invalid equipment status.");
  const result = await equipment.updateOne({ _id: id }, { $set: { status, updatedAt: new Date() } });
  if (!result.matchedCount) throw fail(404, "Equipment not found.");
  res.json({ success: true, status });
}));
app.get("/api/admin/users", ...verifyAdmin, asyncRoute(async (req, res) => {
  const { page, limit, skip } = pagination(req.query, 100, 100);
  const [rows, total] = await Promise.all([users.find({}, { projection: { passwordHash: 0 } }).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(), users.countDocuments({})]);
  res.json({ items: rows.map(cleanUser), total, page, pages: Math.ceil(total / limit) });
}));
app.patch("/api/admin/users/:id/role", ...verifyAdmin, asyncRoute(async (req, res) => {
  const id = toObjectId(req.params.id);
  if (!id || !["customer", "owner", "admin"].includes(req.body.role)) throw fail(400, "Invalid role.");
  if (String(id) === String(req.user._id) && req.body.role !== "admin") throw fail(400, "You cannot remove your own administrator role.");
  const result = await users.updateOne({ _id: id }, { $set: { role: req.body.role, updatedAt: new Date() } });
  if (!result.matchedCount) throw fail(404, "User not found.");
  res.json({ success: true });
}));
app.patch("/api/admin/users/:id/status", ...verifyAdmin, asyncRoute(async (req, res) => {
  const id = toObjectId(req.params.id);
  if (!id || typeof req.body.disabled !== "boolean") throw fail(400, "Invalid account status.");
  if (String(id) === String(req.user._id) && req.body.disabled) throw fail(400, "You cannot disable your own account.");
  const result = await users.updateOne({ _id: id }, { $set: { disabled: req.body.disabled, updatedAt: new Date() } });
  if (!result.matchedCount) throw fail(404, "User not found.");
  res.json({ success: true });
}));

app.get("/api/favorites", ...verifyRenter, asyncRoute(async (req, res) => {
  const rows = await favorites.aggregate([{ $match: { userId: req.user._id } }, { $lookup: { from: "equipment", localField: "equipmentId", foreignField: "_id", as: "equipment" } }, { $unwind: { path: "$equipment", preserveNullAndEmptyArrays: true } }, { $match: { "equipment.status": "approved" } }, { $sort: { createdAt: -1 } }]).toArray();
  res.json({ items: rows.map((row) => ({ favoriteId: idOf(row._id), equipment: publicEquipment({ ...row.equipment, owner: row.equipment.owner }) })) });
}));
app.post("/api/favorites/:equipmentId", ...verifyRenter, asyncRoute(async (req, res) => {
  const equipmentId = toObjectId(req.params.equipmentId);
  if (!equipmentId || !await equipment.findOne({ _id: equipmentId, status: "approved" })) throw fail(404, "Equipment not found.");
  await favorites.updateOne({ userId: req.user._id, equipmentId }, { $setOnInsert: { userId: req.user._id, equipmentId, createdAt: new Date() } }, { upsert: true });
  res.status(201).json({ success: true });
}));
app.delete("/api/favorites/:equipmentId", ...verifyRenter, asyncRoute(async (req, res) => {
  const equipmentId = toObjectId(req.params.equipmentId);
  if (!equipmentId) throw fail(404, "Equipment not found.");
  await favorites.deleteOne({ userId: req.user._id, equipmentId });
  res.status(204).end();
}));

app.post("/api/bookings/quote", asyncRoute(async (req, res) => {
  const equipmentId = toObjectId(req.body.equipmentId);
  const item = equipmentId && await equipment.findOne({ _id: equipmentId, status: "approved" });
  const start = String(req.body.rentalStartDate || "");
  const end = String(req.body.rentalEndDate || "");
  const quantity = Number(req.body.quantity);
  if (!item) throw fail(404, "Approved equipment not found.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || !Number.isInteger(quantity) || quantity < 1) throw fail(400, "Choose valid rental dates and quantity.");
  const units = rentalUnits(start, end, item.rentalType);
  if (!units) throw fail(400, "Rental end date must be after the start date.");
  if (quantity > item.availableQuantity || !await bookingAvailability(item, start, end, quantity)) throw fail(409, "This equipment is not available for those dates and quantity.");
  res.json({ units, totalAmount: units * quantity * item.price, currency });
}));
app.post("/api/bookings", ...verifyRenter, asyncRoute(async (req, res) => {
  if (!stripe) throw fail(503, "Stripe checkout is not configured.");
  const equipmentId = toObjectId(req.body.equipmentId);
  const item = equipmentId && await equipment.findOne({ _id: equipmentId, status: "approved" });
  if (!item) throw fail(404, "Approved equipment not found.");
  const start = String(req.body.rentalStartDate || "");
  const end = String(req.body.rentalEndDate || "");
  const quantity = Number(req.body.quantity);
  const units = rentalUnits(start, end, item.rentalType);
  if (!units || !Number.isInteger(quantity) || quantity < 1 || quantity > item.availableQuantity) throw fail(400, "Choose valid rental dates and quantity.");
  if (!String(req.body.contactNumber || "").trim() || String(req.body.deliveryAddress || "").trim().length < 5) throw fail(400, "Contact number and delivery address are required.");
  if (!await bookingAvailability(item, start, end, quantity)) throw fail(409, "This equipment is not available for those dates and quantity.");
  const totalAmount = units * quantity * item.price;
  const record = { equipmentId, equipmentName: item.name, ownerId: item.ownerId, customerId: req.user._id, rentalStartDate: start, rentalEndDate: end, quantity, unitCount: units, totalAmount, currency, contactNumber: String(req.body.contactNumber).trim(), deliveryAddress: String(req.body.deliveryAddress).trim(), notes: String(req.body.notes || "").trim(), paymentStatus: "pending", bookingStatus: "pending", createdAt: new Date(), updatedAt: new Date() };
  const inserted = await bookings.insertOne(record);
  try {
    const checkout = await stripe.checkout.sessions.create({ mode: "payment", payment_method_types: ["card"], line_items: [{ quantity: 1, price_data: { currency, unit_amount: Math.round(totalAmount * 100), product_data: { name: item.name, description: `${units} ${item.rentalType.toLowerCase()} unit(s), quantity ${quantity}` } } }], metadata: { bookingId: String(inserted.insertedId) }, success_url: `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${frontendUrl}/payment/cancel?bookingId=${inserted.insertedId}` });
    await bookings.updateOne({ _id: inserted.insertedId }, { $set: { stripeSessionId: checkout.id, updatedAt: new Date() } });
    await payments.insertOne({ bookingId: inserted.insertedId, customerId: req.user._id, amount: totalAmount, currency, status: "pending", stripeSessionId: checkout.id, createdAt: new Date() });
    res.status(201).json({ bookingId: String(inserted.insertedId), checkoutUrl: checkout.url });
  } catch (error) {
    await bookings.deleteOne({ _id: inserted.insertedId });
    await payments.deleteOne({ bookingId: inserted.insertedId });
    throw error;
  }
}));
app.get("/api/bookings/mine", ...verifyRenter, asyncRoute(async (req, res) => {
  const rows = await bookings.find({ customerId: req.user._id }).sort({ createdAt: -1 }).toArray();
  const items = await Promise.all(rows.map(loadBooking));
  res.json({ items: items.filter(Boolean).map(publicBooking) });
}));
app.get("/api/bookings/owner", ...verifyOwner, asyncRoute(async (req, res) => {
  const rows = await bookings.find({ ownerId: req.user._id }).sort({ createdAt: -1 }).toArray();
  const items = await Promise.all(rows.map(loadBooking));
  res.json({ items: items.filter(Boolean).map(publicBooking) });
}));
app.get("/api/bookings/admin", ...verifyAdmin, asyncRoute(async (req, res) => {
  const { limit } = pagination(req.query, 100, 200);
  const rows = await bookings.find({}).sort({ createdAt: -1 }).limit(limit).toArray();
  const items = await Promise.all(rows.map(loadBooking));
  res.json({ items: items.filter(Boolean).map(publicBooking) });
}));
app.get("/api/bookings/checkout/:sessionId", ...verifyRenter, asyncRoute(async (req, res) => {
  const booking = await bookings.findOne({ stripeSessionId: req.params.sessionId, customerId: req.user._id });
  if (!booking) throw fail(404, "Booking not found.");
  if (booking.paymentStatus === "pending" && stripe) {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    if (session.payment_status === "paid") {
      if (["cancelled", "rejected"].includes(booking.bookingStatus) && session.payment_intent) {
        const refund = await stripe.refunds.create({ payment_intent: session.payment_intent });
        await bookings.updateOne({ _id: booking._id }, { $set: { paymentStatus: "refunded", stripePaymentIntentId: String(session.payment_intent), refundId: refund.id, updatedAt: new Date() } });
        await payments.updateOne({ bookingId: booking._id }, { $set: { status: "refunded", transactionId: String(session.payment_intent), refundId: refund.id, updatedAt: new Date() } });
      } else {
        await bookings.updateOne({ _id: booking._id, bookingStatus: { $nin: ["cancelled", "rejected"] } }, { $set: { paymentStatus: "paid", stripePaymentIntentId: String(session.payment_intent || ""), paidAt: new Date(), updatedAt: new Date() } });
        await payments.updateOne({ bookingId: booking._id }, { $set: { status: "paid", transactionId: String(session.payment_intent || session.id), updatedAt: new Date() } });
      }
    }
  }
  res.json({ booking: publicBooking(await loadBooking(booking._id)) });
}));
app.post("/api/bookings/:bookingId/cancel-checkout", ...verifyRenter, asyncRoute(async (req, res) => {
  const id = toObjectId(req.params.bookingId);
  if (!id) throw fail(404, "Booking not found.");
  const booking = await bookings.findOne({ _id: id, customerId: req.user._id });
  if (!booking) throw fail(404, "Booking not found.");
  if (booking.paymentStatus === "pending") {
    if (stripe && booking.stripeSessionId) try { await stripe.checkout.sessions.expire(booking.stripeSessionId); } catch {}
    await bookings.updateOne({ _id: id }, { $set: { paymentStatus: "failed", bookingStatus: "cancelled", updatedAt: new Date() } });
    await payments.updateOne({ bookingId: id }, { $set: { status: "failed", updatedAt: new Date() } });
  }
  res.json({ booking: publicBooking(await loadBooking(id)) });
}));
app.patch("/api/bookings/:bookingId/status", ...verifyAnyUser, asyncRoute(async (req, res) => {
  const id = toObjectId(req.params.bookingId);
  if (!id) throw fail(404, "Booking not found.");
  const booking = await bookings.findOne({ _id: id });
  if (!booking) throw fail(404, "Booking not found.");
  const status = req.body.bookingStatus;
  if (req.user.role === "admin") {
    if (!bookingStatusAllowed(status)) throw fail(400, "Invalid booking status.");
    if (status === "confirmed" && booking.paymentStatus !== "paid") throw fail(400, "Only paid bookings can be confirmed.");
  } else {
    if (req.user.role !== "owner" || String(booking.ownerId) !== String(req.user._id)) throw fail(403, "Only this equipment owner can respond to the booking.");
    if (!["confirmed", "rejected"].includes(status) || booking.paymentStatus !== "paid" || booking.bookingStatus !== "pending") throw fail(400, "This booking cannot be updated.");
  }
  let paymentStatus = booking.paymentStatus;
  let refundId;
  if (["rejected", "cancelled"].includes(status) && booking.paymentStatus === "paid") {
    if (!stripe || !booking.stripePaymentIntentId) throw fail(503, "A Stripe refund cannot be created for this booking right now.");
    const refund = await stripe.refunds.create({ payment_intent: booking.stripePaymentIntentId });
    refundId = refund.id;
    paymentStatus = "refunded";
    await payments.updateOne({ bookingId: id }, { $set: { status: "refunded", refundId, updatedAt: new Date() } });
  } else if (["rejected", "cancelled"].includes(status) && booking.paymentStatus === "pending") {
    if (stripe && booking.stripeSessionId) try { await stripe.checkout.sessions.expire(booking.stripeSessionId); } catch {}
    paymentStatus = "failed";
    await payments.updateOne({ bookingId: id }, { $set: { status: "failed", updatedAt: new Date() } });
  }
  await bookings.updateOne({ _id: id }, { $set: { bookingStatus: status, paymentStatus, ...(refundId ? { refundId } : {}), updatedAt: new Date() } });
  if (status === "completed") {
    try { await notifyCompletion({ ...booking, bookingStatus: status }); } catch (error) { console.error("Completion email failed", error); }
  }
  res.json({ booking: publicBooking(await loadBooking(id)) });
}));
function bookingStatusAllowed(value) { return ["pending", "confirmed", "rejected", "completed", "cancelled"].includes(value); }
app.get("/api/payments/mine", ...verifyRenter, asyncRoute(async (req, res) => {
  const rows = await payments.find({ customerId: req.user._id }).sort({ createdAt: -1 }).toArray();
  res.json({ items: rows.map((row) => ({ id: idOf(row._id), bookingId: idOf(row.bookingId), status: row.status, amount: row.amount, currency: row.currency, transactionId: row.transactionId, paymentIntentId: row.transactionId })) });
}));

app.get("/api/analytics/admin", ...verifyAdmin, asyncRoute(async (_req, res) => {
  const [totalUsers, totalEquipment, totalBookings, pendingApprovals, completedRentals, revenueRows, bookingRows, monthlyRevenueRows] = await Promise.all([
    users.countDocuments({}), equipment.countDocuments({}), bookings.countDocuments({}), equipment.countDocuments({ status: "pending" }), bookings.countDocuments({ bookingStatus: "completed" }),
    payments.aggregate([{ $match: { status: "paid" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]).toArray(),
    bookings.aggregate([{ $match: { createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1) } } }, { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, bookings: { $sum: 1 } } }, { $sort: { _id: 1 } }]).toArray(),
    payments.aggregate([{ $match: { status: "paid", createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1) } } }, { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, revenue: { $sum: "$amount" } } }, { $sort: { _id: 1 } }]).toArray(),
  ]);
  const monthKeys = Array.from({ length: 12 }, (_, index) => { const date = new Date(); date.setDate(1); date.setMonth(date.getMonth() - 11 + index); return date.toISOString().slice(0, 7); });
  const bookingsByMonth = new Map(bookingRows.map((row) => [row._id, row.bookings]));
  const revenueByMonth = new Map(monthlyRevenueRows.map((row) => [row._id, row.revenue]));
  res.json({ totalUsers, totalEquipment, totalBookings, pendingApprovals, completedRentals, totalRevenue: revenueRows[0]?.total || 0, monthlyBookings: monthKeys.map((month) => ({ month, bookings: bookingsByMonth.get(month) || 0 })), monthlyRevenue: monthKeys.map((month) => ({ month, revenue: revenueByMonth.get(month) || 0 })) });
}));
app.get("/api/analytics/owner", ...verifyOwner, asyncRoute(async (req, res) => {
  const [totalListedEquipment, completedRentals, earningsRows, monthlyRows] = await Promise.all([
    equipment.countDocuments({ ownerId: req.user._id }), bookings.countDocuments({ ownerId: req.user._id, bookingStatus: "completed" }),
    payments.aggregate([{ $lookup: { from: "bookings", localField: "bookingId", foreignField: "_id", as: "booking" } }, { $unwind: "$booking" }, { $match: { status: "paid", "booking.ownerId": req.user._id } }, { $group: { _id: null, total: { $sum: "$amount" } } }]).toArray(),
    payments.aggregate([{ $lookup: { from: "bookings", localField: "bookingId", foreignField: "_id", as: "booking" } }, { $unwind: "$booking" }, { $match: { status: "paid", "booking.ownerId": req.user._id, createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1) } } }, { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, earnings: { $sum: "$amount" } } }, { $sort: { _id: 1 } }]).toArray(),
  ]);
  const monthly = new Map(monthlyRows.map((row) => [row._id, row.earnings]));
  const months = Array.from({ length: 12 }, (_, index) => { const date = new Date(); date.setDate(1); date.setMonth(date.getMonth() - 11 + index); return date.toISOString().slice(0, 7); });
  res.json({ totalListedEquipment, completedRentals, totalEarnings: earningsRows[0]?.total || 0, monthlyEarnings: months.map((month) => ({ month, earnings: monthly.get(month) || 0 })) });
}));

app.get("/api/reviews/featured", asyncRoute(async (_req, res) => {
  const items = await reviews.aggregate([{ $sort: { createdAt: -1 } }, { $limit: 8 }, { $lookup: { from: "users", localField: "customerId", foreignField: "_id", as: "customer" } }, { $unwind: "$customer" }, { $project: { _id: 0, id: { $toString: "$_id" }, name: "$customer.name", role: { $literal: "Verified renter" }, quote: 1, rating: 1 } }]).toArray();
  res.json({ items });
}));
app.get("/api/reviews/mine", ...verifyRenter, asyncRoute(async (req, res) => {
  const items = await reviews.find({ customerId: req.user._id }, { projection: { bookingId: 1, rating: 1, quote: 1, createdAt: 1 } }).sort({ createdAt: -1 }).toArray();
  res.json({ items: items.map((item) => ({ id: idOf(item._id), bookingId: idOf(item.bookingId), rating: item.rating, quote: item.quote, createdAt: item.createdAt })) });
}));
app.post("/api/reviews", ...verifyRenter, asyncRoute(async (req, res) => {
  const bookingId = toObjectId(req.body.bookingId);
  const rating = Number(req.body.rating);
  const quote = String(req.body.quote || "").trim();
  if (!bookingId || !Number.isInteger(rating) || rating < 1 || rating > 5 || quote.length < 10 || quote.length > 1000) throw fail(400, "A completed booking, 1–5 rating, and review of 10–1000 characters are required.");
  const booking = await bookings.findOne({ _id: bookingId, customerId: req.user._id, bookingStatus: "completed", paymentStatus: "paid" });
  if (!booking) throw fail(403, "Only completed rentals can be reviewed.");
  if (await reviews.findOne({ bookingId })) throw fail(409, "This rental already has a review.");
  const result = await reviews.insertOne({ bookingId, customerId: req.user._id, equipmentId: booking.equipmentId, rating, quote, createdAt: new Date() });
  res.status(201).json({ reviewId: String(result.insertedId) });
}));

app.use((req, _res, next) => next(fail(404, `Route not found: ${req.method} ${req.path}`)));
app.use((error, _req, res, _next) => {
  const status = Number(error.status) || 500;
  if (status >= 500) console.error(error);
  res.status(status).json({ message: status >= 500 ? "An unexpected server error occurred." : error.message });
});

async function start() {
  await client.connect();
  db = client.db(dbName);
  users = db.collection("users"); equipment = db.collection("equipment"); bookings = db.collection("bookings");
  payments = db.collection("payments"); favorites = db.collection("favorites"); reviews = db.collection("reviews");
  await Promise.all([
    users.createIndex({ email: 1 }, { unique: true }),
    equipment.createIndex({ status: 1, createdAt: -1 }), equipment.createIndex({ ownerId: 1, createdAt: -1 }),
    bookings.createIndex({ customerId: 1, createdAt: -1 }), bookings.createIndex({ ownerId: 1, createdAt: -1 }), bookings.createIndex({ stripeSessionId: 1 }, { sparse: true }),
    payments.createIndex({ bookingId: 1 }, { unique: true }), favorites.createIndex({ userId: 1, equipmentId: 1 }, { unique: true }), reviews.createIndex({ bookingId: 1 }, { unique: true }),
  ]);
  await ensureAdmin();
  app.listen(port, () => console.log(`Fieldkit API listening on port ${port}`));
}

cron.schedule("15 0 * * *", async () => {
  const now = new Date();
  const due = await bookings.find({ paymentStatus: "paid", bookingStatus: "confirmed", rentalEndDate: { $lt: now.toISOString().slice(0, 10) } }).toArray();
  for (const booking of due) {
    const result = await bookings.updateOne({ _id: booking._id, bookingStatus: "confirmed" }, { $set: { bookingStatus: "completed", completedAt: now, updatedAt: now } });
    if (result.modifiedCount) try { await notifyCompletion(booking); } catch (error) { console.error("Completion email failed", error); }
  }
});

start().catch((error) => { console.error("Could not start Fieldkit API", error); process.exit(1); });
