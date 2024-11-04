import { initReactI18next } from 'react-i18next';
import pl_PL from './pl_PL.json';
import i18n from 'i18next';

i18n.use(initReactI18next).init({
  resources: { pl: { translation: pl_PL } },
  lng: 'pl',
});

export default i18n;
