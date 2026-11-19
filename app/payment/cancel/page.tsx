import { Suspense } from "react";
import { PaymentCancelledFromQuery } from "../../components/payment-result";

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={<div className="detail-loading" role="status">Loading checkout status...</div>}>
      <PaymentCancelledFromQuery />
    </Suspense>
  );
}
