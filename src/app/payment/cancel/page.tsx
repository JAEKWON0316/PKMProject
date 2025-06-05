export default function CancelPage() {
  return (
    <div className="max-w-lg mx-auto py-20 text-center">
      <h1 className="text-2xl font-bold mb-4">결제가 취소되었습니다.</h1>
      <p className="mb-6">결제가 정상적으로 완료되지 않았습니다.<br />다시 시도하거나, 문제가 지속되면 고객센터로 문의해 주세요.</p>
      <a href="/pricing" className="inline-block px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">가격 페이지로 돌아가기</a>
    </div>
  );
} 