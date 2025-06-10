import React from "react";

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-24 sm:pt-32 pb-12 sm:pb-16 text-gray-800 dark:text-gray-200">
      <h1 className="text-3xl sm:text-4xl font-bold mb-2">PKM AI 개인정보처리방침</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">최종 갱신일: 2025-06-10</p>
      <nav className="mb-8">
        <ul className="list-disc list-inside space-y-1 text-base">
          <li><a href="#collect" className="hover:underline text-[#b975ff]">1. 수집하는 개인정보 항목</a></li>
          <li><a href="#use" className="hover:underline text-[#b975ff]">2. 개인정보의 이용 목적</a></li>
          <li><a href="#share" className="hover:underline text-[#b975ff]">3. 개인정보의 제공 및 공유</a></li>
          <li><a href="#store" className="hover:underline text-[#b975ff]">4. 개인정보의 보관 및 파기</a></li>
          <li><a href="#rights" className="hover:underline text-[#b975ff]">5. 이용자의 권리</a></li>
          <li><a href="#security" className="hover:underline text-[#b975ff]">6. 개인정보 보호를 위한 조치</a></li>
          <li><a href="#contact" className="hover:underline text-[#b975ff]">7. 문의처</a></li>
        </ul>
      </nav>
      <section id="collect" className="mb-8">
        <h2 className="text-xl font-semibold mb-2">1. 수집하는 개인정보 항목</h2>
        <p className="leading-relaxed">서비스 제공을 위해 이메일, 이름 등 최소한의 개인정보를 수집합니다. 수집 항목은 서비스 유형에 따라 달라질 수 있습니다.</p>
      </section>
      <section id="use" className="mb-8">
        <h2 className="text-xl font-semibold mb-2">2. 개인정보의 이용 목적</h2>
        <p className="leading-relaxed">수집한 개인정보는 회원 관리, 서비스 제공 및 개선, 문의 대응, 법적 의무 이행 등을 위해 사용됩니다.</p>
      </section>
      <section id="share" className="mb-8">
        <h2 className="text-xl font-semibold mb-2">3. 개인정보의 제공 및 공유</h2>
        <p className="leading-relaxed">회사는 원칙적으로 이용자의 동의 없이 개인정보를 외부에 제공하지 않습니다. 단, 법령에 따라 요구되는 경우 등 예외가 있습니다.</p>
      </section>
      <section id="store" className="mb-8">
        <h2 className="text-xl font-semibold mb-2">4. 개인정보의 보관 및 파기</h2>
        <p className="leading-relaxed">개인정보는 수집 및 이용 목적이 달성된 후 지체 없이 파기합니다. 단, 관련 법령에 따라 일정 기간 보관이 필요한 경우에는 해당 기간 동안 안전하게 보관합니다.</p>
      </section>
      <section id="rights" className="mb-8">
        <h2 className="text-xl font-semibold mb-2">5. 이용자의 권리</h2>
        <p className="leading-relaxed">이용자는 언제든지 자신의 개인정보를 조회, 수정, 삭제 요청할 수 있습니다. 권리 행사는 dlwornjs0316@gmail.com으로 문의해주시기 바랍니다.</p>
      </section>
      <section id="security" className="mb-8">
        <h2 className="text-xl font-semibold mb-2">6. 개인정보 보호를 위한 조치</h2>
        <p className="leading-relaxed">회사는 개인정보 보호를 위해 기술적, 관리적 안전조치를 시행하고 있습니다.</p>
      </section>
      <section id="contact" className="mb-8">
        <h2 className="text-xl font-semibold mb-2">7. 문의처</h2>
        <p className="leading-relaxed">개인정보 관련 문의는 dlwornjs0316@gmail.com으으로 연락해주시기 바랍니다.</p>
      </section>
    </div>
  );
} 