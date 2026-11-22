import { useId } from 'react';
import { learnCategories, type LearnCategory } from './subjects';
import './subject-menu.css';

export function LearnCategorySelector({ value, onChange }: {
  value: LearnCategory;
  onChange: (category: LearnCategory) => void;
}) {
  const name = useId();
  return (
    <div className="learn-category-selector" role="group" aria-label="Subject category">
      {learnCategories.map(category => (
        <label key={category}>
          <input className="sr-only" type="radio" name={name} value={category}
            checked={value === category} onChange={() => onChange(category)} />
          <span>{category}</span>
        </label>
      ))}
    </div>
  );
}
