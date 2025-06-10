import React from "react";

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-24 sm:pt-32 pb-12 sm:pb-16 text-gray-800 dark:text-gray-200">
      <h1 className="text-3xl sm:text-4xl font-bold mb-2">PKM AI 서비스 이용약관</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">최종 갱신일: 2025-06-10</p>
      <nav className="mb-8">
        <ul className="list-disc list-inside space-y-1 text-base">
          <li><a href="#purpose" className="hover:underline text-[#b975ff]">1. 목적</a></li>
          <li><a href="#account" className="hover:underline text-[#b975ff]">2. 계정 및 보안</a></li>
          <li><a href="#usage" className="hover:underline text-[#b975ff]">3. 서비스 이용</a></li>
          <li><a href="#restriction" className="hover:underline text-[#b975ff]">4. 이용 제한 및 해지</a></li>
          <li><a href="#liability" className="hover:underline text-[#b975ff]">5. 책임의 한계</a></li>
          <li><a href="#change" className="hover:underline text-[#b975ff]">6. 약관의 변경</a></li>
          <li><a href="#contact" className="hover:underline text-[#b975ff]">7. 문의처</a></li>
        </ul>
      </nav>
      <section id="purpose" className="mb-8">
        <h2 className="text-xl font-semibold mb-2">1. 목적</h2>
        <p className="leading-relaxed">본 약관은 PKM AI(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
      </section>
      <section id="account" className="mb-8">
        <h2 className="text-xl font-semibold mb-2">2. 계정 및 보안</h2>
        <p className="leading-relaxed">이용자는 서비스 이용을 위해 정확한 정보를 제공해야 하며, 계정 및 비밀번호 관리에 대한 책임은 이용자에게 있습니다. 부정확한 정보 제공 또는 계정 도용 등으로 발생하는 문제에 대해 회사는 책임지지 않습니다.</p>
      </section>
      <section id="usage" className="mb-8">
        <h2 className="text-xl font-semibold mb-2">3. 서비스 이용</h2>
        <p className="leading-relaxed">이용자는 본 서비스를 법령 및 본 약관에 따라 이용해야 하며, 불법적이거나 부적절한 목적으로 서비스를 이용할 수 없습니다.</p>
      </section>
      <section id="restriction" className="mb-8">
        <h2 className="text-xl font-semibold mb-2">4. 이용 제한 및 해지</h2>
        <p className="leading-relaxed">회사는 이용자가 약관을 위반하거나 서비스 운영에 지장을 주는 경우 사전 통지 없이 서비스 이용을 제한하거나 계정을 해지할 수 있습니다.</p>
      </section>
      <section id="liability" className="mb-8">
        <h2 className="text-xl font-semibold mb-2">5. 책임의 한계</h2>
        <p className="leading-relaxed">서비스는 "있는 그대로" 제공되며, 회사는 서비스의 정확성, 신뢰성, 지속성에 대해 보장하지 않습니다. 서비스 이용으로 발생하는 모든 책임은 이용자에게 있습니다.</p>
      </section>
      <section id="change" className="mb-8">
        <h2 className="text-xl font-semibold mb-2">6. 약관의 변경</h2>
        <p className="leading-relaxed">회사는 필요 시 약관을 변경할 수 있으며, 변경 시 서비스 내 공지 또는 이메일 등으로 안내합니다. 변경된 약관은 공지 시 명시된 효력 발생일부터 적용됩니다.</p>
      </section>
      <section id="contact" className="mb-8">
        <h2 className="text-xl font-semibold mb-2">7. 문의처</h2>
        <p className="leading-relaxed">서비스 이용 관련 문의는 dlwornjs0316@gmail.com으로 연락해주시기 바랍니다.</p>
      </section>
    </div>
  );
} 