import { Injectable } from '@angular/core';
import {
  SkillProgress,
  SpeakingPrompt,
  ListeningExercise,
  VocabCard,
} from '../models';

@Injectable({ providedIn: 'root' })
export class DataService {
  getProgress(): SkillProgress[] {
    return [
      { key: 'speaking', label: 'Speaking', score: 68, target: 80 },
      { key: 'listening', label: 'Listening', score: 74, target: 75 },
      { key: 'vocabulary', label: 'Vocabulary', score: 81, target: 85 },
      { key: 'image', label: 'Image Description', score: 62, target: 75 },
    ];
  }

  getSpeakingPrompts(): SpeakingPrompt[] {
    return [
      {
        id: 'sp1',
        topic: 'Introducing yourself',
        level: 'B1',
        question: 'Stellt Iech wgl. vir: Wéi heescht Dir a wou wunnt Dir?',
        questionEn: 'Please introduce yourself: what is your name and where do you live?',
        tips: [
          'Start with "Ech heeschen..." (My name is...)',
          'Mention your town: "Ech wunnen zu..."',
          'Add one detail about your daily life.',
        ],
      },
      {
        id: 'sp2',
        topic: 'Daily routine',
        level: 'B1',
        question: 'Beschreift Ären normalen Dag vu moies bis owes.',
        questionEn: 'Describe your normal day from morning to evening.',
        tips: [
          'Use time markers: "moies", "mëttes", "owes".',
          'Use the present tense for habits.',
          'Connect ideas with "duerno" (afterwards).',
        ],
      },
      {
        id: 'sp3',
        topic: 'Living in Luxembourg',
        level: 'B1',
        question: 'Wat gefält Iech am beschten zu Lëtzebuerg a firwat?',
        questionEn: 'What do you like best about Luxembourg and why?',
        tips: [
          'Give an opinion: "Mir gefält..."',
          'Justify with "well..." (because).',
          'Mention a concrete example.',
        ],
      },
      {
        id: 'sp4',
        topic: 'Shopping & services',
        level: 'A2',
        question: 'Dir sidd am Geschäft. Frot no engem Produit a sengem Präis.',
        questionEn: 'You are in a shop. Ask for a product and its price.',
        tips: [
          'Use "Ech hätt gär..." (I would like...).',
          'Ask "Wéi vill kascht dat?" (How much is it?).',
          'Be polite: "Merci villmools".',
        ],
      },
    ];
  }

  getListeningExercises(): ListeningExercise[] {
    return [
      {
        id: 'li1',
        title: 'At the bakery',
        level: 'A2',
        durationSec: 42,
        transcript:
          'Gudde Mëtteg! Ech hätt gär zwee Croissanten an e Brout, wann ech gelift. — Dat mécht véier Euro fofzeg. — Hei sidd Dir. Merci!',
        question: 'How much did the customer pay?',
        options: ['Four euros fifty', 'Two euros', 'Fourteen euros', 'Five euros'],
        answerIndex: 0,
      },
      {
        id: 'li2',
        title: 'Taking the bus',
        level: 'A2',
        durationSec: 55,
        transcript:
          'Entschëllegt, fiert dëse Bus op de Kierchbierg? — Jo, awer Dir musst zu Glacis ëmklammen. — Wéini fiert den nächste Bus? — An zéng Minutten.',
        question: 'When does the next bus leave?',
        options: ['In ten minutes', 'In two minutes', 'At ten o’clock', 'Now'],
        answerIndex: 0,
      },
      {
        id: 'li3',
        title: 'A doctor’s appointment',
        level: 'B1',
        durationSec: 68,
        transcript:
          'Gudde Moien, ech hätt gär en Rendez-vous mam Dokter. — Wat fir e Problem hutt Dir? — Ech hunn zënter gëschter Kappwéi a Féiwer. — Kommt da muer moies um néng Auer.',
        question: 'What symptoms does the patient mention?',
        options: [
          'Headache and fever',
          'Stomach ache',
          'A broken arm',
          'A cough only',
        ],
        answerIndex: 0,
      },
    ];
  }

  getVocabCards(): VocabCard[] {
    return [
      { id: 'v1', lb: 'Moien', en: 'Hello / Good morning', example: 'Moien, wéi geet et?', theme: 'Greetings' },
      { id: 'v2', lb: 'Merci', en: 'Thank you', example: 'Merci villmools fir d’Hëllef!', theme: 'Greetings' },
      { id: 'v3', lb: 'd’Aarbecht', en: 'work / job', example: 'Ech ginn op d’Aarbecht mam Vëlo.', theme: 'Work' },
      { id: 'v4', lb: 'de Wunnsëtz', en: 'place of residence', example: 'Mäi Wunnsëtz ass zu Esch.', theme: 'Daily life' },
      { id: 'v5', lb: 'd’Gemeng', en: 'municipality', example: 'Ech war op der Gemeng fir Pabeieren.', theme: 'Administration' },
      { id: 'v6', lb: 'wann ech gelift', en: 'please', example: 'E Kaffi, wann ech gelift.', theme: 'Greetings' },
      { id: 'v7', lb: 'd’Wieder', en: 'the weather', example: 'D’Wieder ass haut schéin.', theme: 'Daily life' },
      { id: 'v8', lb: 'gären', en: 'gladly / to like', example: 'Ech sinn gär zu Lëtzebuerg.', theme: 'Daily life' },
    ];
  }
}
