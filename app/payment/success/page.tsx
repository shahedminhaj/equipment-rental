import { Suspense } from "react";
import { PaymentSuccessFromQuery } from "../../components/payment-result";

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="detail-loading" role="status">Loading payment status...</div>}>
      <PaymentSuccessFromQuery />
    </Suspense>
  );
}
