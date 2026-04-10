import { Suspense } from "react";
import UploadClient from "./UploadClient";

export default function UploadPage() {
  return (
    <Suspense fallback={null}>
      <UploadClient />
    </Suspense>
  );
}
