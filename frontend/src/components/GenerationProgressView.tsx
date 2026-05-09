import { Loader2 } from 'lucide-react';

interface GenerationProgressProps {
  statusMessage?: string;
}

const steps = [
  'Ініціалізація завдання...',
  'Завантаження відео...',
  'Аналіз відео за допомогою ШІ...',
  'Створення скріншотів кроків...',
  'Завантаження зображень у хмару...',
  'Збереження рецепта...'
];

export function GenerationProgressView({ statusMessage }: GenerationProgressProps) {
  // Try to find current step index based on status message to show progress visually
  const currentIndex = steps.findIndex(step => statusMessage?.includes(step));
  const activeIndex = currentIndex !== -1 ? currentIndex : 0;

  return (
    <div className="generation-progress-wrapper fade-in">
      <div className="generation-status-card">
        <div className="status-header">
          <Loader2 className="spinner" size={28} />
          <h3>Створюємо магію...</h3>
        </div>
        <p className="status-text-primary">
          {statusMessage || 'ШІ аналізує відео та створює покроковий рецепт...'}
        </p>

        <div className="steps-container">
          {steps.map((step, index) => {
            let stepClass = 'step-item';
            if (index < activeIndex) stepClass += ' completed';
            else if (index === activeIndex) stepClass += ' active';
            
            return (
              <div key={index} className={stepClass}>
                <div className="step-indicator"></div>
                <span className="step-label">{step}</span>
              </div>
            );
          })}
        </div>

        <div className="recipe-skeleton-preview">
          <div className="skeleton-image pulse"></div>
          <div className="skeleton-content">
            <div className="skeleton-title pulse"></div>
            <div className="skeleton-meta pulse"></div>
            <div className="skeleton-lines">
              <div className="skeleton-line pulse" style={{ width: '100%' }}></div>
              <div className="skeleton-line pulse" style={{ width: '80%' }}></div>
              <div className="skeleton-line pulse" style={{ width: '90%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
