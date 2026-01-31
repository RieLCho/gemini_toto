import { AlertTriangle, Github } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-20 px-4 pb-12">
      <div className="max-w-xl mx-auto">
        {/* Disclaimer */}
        <div className="glass-card rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-amber-400 mb-1">주의사항</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                본 서비스는 오락 및 참고 목적으로만 제공됩니다. 
                AI 예측은 실제 경기 결과를 보장하지 않으며, 
                도박 또는 베팅의 근거로 사용하지 마시기 바랍니다.
              </p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors text-sm"
            >
              <Github size={16} />
              <span>GitHub</span>
            </a>
          </div>
          <p className="text-gray-600 text-xs">
            © 2026 Gemini Toto. Powered by Google Gemini AI.
          </p>
        </div>
      </div>
    </footer>
  );
}
