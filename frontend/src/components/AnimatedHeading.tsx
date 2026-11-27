import { motion } from 'framer-motion';
import { usePreferences } from '../state/PreferencesContext';

export function AnimatedHeading() {
  const { motionOff } = usePreferences();
  return (
    <h1 id="hero-title" aria-label="Share the ticket. Protect the customer.">
      {['Share the ticket.', 'Protect the customer.'].map((line, lineIndex) => (
        <span className="hero-heading-line" key={line} aria-hidden="true">
          {line.split(' ').map((word, wordIndex) => (
            <motion.span
              key={word}
              className="inline-block"
              initial={motionOff ? false : { opacity: 0, y: -40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={motionOff ? { duration: 0 } : {
                type: 'spring', stiffness: 240, damping: 20, delay: (lineIndex * 3 + wordIndex) * 0.065,
              }}
            >{word}</motion.span>
          ))}
        </span>
      ))}
    </h1>
  );
}
