import { X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const GameGuide = ({ onClose }: { onClose: () => void }) => {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-red-500">{t('guideTitle')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-gray-300">
          <section>
            <p className="text-lg mb-4">{t('guideIntro')}</p>
          </section>

          <section>
            <h3 className="text-2xl font-bold text-purple-400 mb-3">{t('guideRoles')}</h3>
            <div className="space-y-3 bg-gray-800/50 p-4 rounded-lg">
              <div>
                <span className="text-red-500 font-bold">🧛 {t('vampir')}</span>
                <p className="ml-6 mt-1">{t('guideVampir')}</p>
              </div>
              <div>
                <span className="text-green-500 font-bold">👨‍🌾 {t('koylu')}</span>
                <p className="ml-6 mt-1">{t('guideKoylu')}</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-2xl font-bold text-blue-400 mb-3">{t('guideGameFlow')}</h3>
            <div className="space-y-4">
              <div className="bg-yellow-900/20 border border-yellow-700/30 p-4 rounded-lg">
                <h4 className="font-bold text-yellow-400 mb-2">☀️ {t('dayPhase')}</h4>
                <p>{t('guideDay')}</p>
              </div>
              <div className="bg-blue-900/20 border border-blue-700/30 p-4 rounded-lg">
                <h4 className="font-bold text-blue-400 mb-2">🌙 {t('nightPhase')}</h4>
                <p>{t('guideNight')}</p>
              </div>
              <div className="bg-purple-900/20 border border-purple-700/30 p-4 rounded-lg">
                <h4 className="font-bold text-purple-400 mb-2">🗳️ {t('votingPhase')}</h4>
                <p>{t('guideVoting')}</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-2xl font-bold text-green-400 mb-3">{t('guideWinConditions')}</h3>
            <div className="space-y-3 bg-gray-800/50 p-4 rounded-lg">
              <div>
                <span className="text-red-500 font-bold">🧛 {t('vampiresWin')}</span>
                <p className="ml-6 mt-1">{t('guideVampiresWin')}</p>
              </div>
              <div>
                <span className="text-green-500 font-bold">👨‍🌾 {t('villagersWin')}</span>
                <p className="ml-6 mt-1">{t('guideVillagersWin')}</p>
              </div>
            </div>
          </section>
        </div>

        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-6">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-bold hover:from-red-700 hover:to-red-800 transition-all"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameGuide;
