import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

// Interface labels only. Rules, answers, letters, records and FAQs come from the backend.
const STRINGS = {
  hi: {
    languageLabel: 'भाषा चुनें',
    chooseLanguage: 'अपनी भाषा चुनें',
    voiceTitle: 'अपनी बात बोलकर पूछें',
    voiceSubtitle: 'आप अपनी भाषा में सवाल पूछ सकते हैं।',
    languageSelected: (name) => `${name} चुनी गई`,
    answerPlaying: 'सुना रहे हैं',
    speakingNow: 'जवाब बोलकर सुनाया जा रहा है',
    preparingVoice: 'आवाज़ तैयार हो रही है...',
    nowReading: 'अभी पढ़ा जा रहा है',
    spokenText: 'जो पढ़कर सुनाया गया',
    understanding: 'आपकी बात समझ रहे हैं...',
    heardAs: 'पहचानी गई भाषा',
    heardWrong: 'गलत सुना हो तो फिर से बोलें',
    micNoDevice: 'कोई माइक नहीं मिला। माइक जोड़ें, या लिखकर पूछें।',
    speechFailed: 'जवाब अभी बोलकर नहीं सुनाया जा सका। इंटरनेट जाँचें और फिर से सुनें दबाएं, या जवाब पढ़ लें।',
    micRetry: 'आवाज़ पहचान सेवा नहीं मिली। कृपया माइक फिर से दबाएं।',
    languageFallback: 'इस भाषा में अनुवाद अभी उपलब्ध नहीं है, इसलिए जवाब हिंदी में दिखाया गया है।',
    aiTranslationNote: 'यह अनुवाद AI से हुआ है और इसकी भाषा-जाँच नहीं हुई है। तारीख, संख्या और नियम नहीं बदलते।',
    step: 'चरण',
    answerFound: 'जवाब मिला',
    answerNotFound: 'जवाब नहीं मिला',
    documentType: 'दस्तावेज़ का प्रकार',
    purpose: 'उद्देश्य',
    sampleRecord: 'काल्पनिक नमूना रिकॉर्ड',
    ticked: (done, total) => `${total} में से ${done} तैयार`,
    openLabel: 'खोलें',
    actionAskDesc: 'बोलकर नियम पूछें',
    actionPaperDesc: 'सरकारी नोटिस समझें',
    actionRecordDesc: 'खतियान और खेसरा देखें',
    problemSubtitle: 'सर्वे में ग्रामीण परिवारों की मुख्य चुनौतियाँ',
    howSubtitle: 'तीन आसान चरणों में, बिना किसी बिचौलिए के',
    featuresSubtitle: 'इस प्रोटोटाइप की सुविधाएँ',
    whoSubtitle: 'नागरिकों और संस्थाओं के लिए',
    faqSubtitle: 'सुरक्षा, भाषा और नियमों के बारे में',
    brandTagline: 'अपनी भाषा में ज़मीन के कागज़ समझें',
    fraudBanner: 'सर्वे की स्व-घोषणा के लिए कोई शुल्क नहीं है। किसी बिचौलिए को पैसे न दें। (नियम S6)',
    disclaimer: 'नियम S1–S7 और सभी रिकॉर्ड काल्पनिक नमूना डेटा हैं। यह असली कानून या कानूनी सलाह नहीं है।',
    navHome: 'होम', navAsk: 'बोलकर पूछें', navPaper: 'कागज़ समझाएं', navRecord: 'मेरी ज़मीन', navRules: 'नियम S1–S7', navHelp: 'मदद',
    toggleMenu: 'मेन्यू खोलें या बंद करें',
    loading: 'लोड हो रहा है...',
    retry: 'फिर से कोशिश करें',
    serverDown: 'सर्वर से संपर्क नहीं हो पाया। देखें कि बैकएंड चल रहा है या नहीं।',
    genericError: 'कुछ गड़बड़ हो गई। कृपया फिर से कोशिश करें।',
    listen: 'सुनें', stop: 'रुकें',
    source: 'स्रोत', noSource: 'उपलब्ध नियमों में नहीं', viaGemini: 'Gemini AI से', viaOffline: 'ऑफ़लाइन जवाब', viaGuard: 'सुरक्षा जाँच से',
    documents: 'ज़रूरी कागज़', action: 'आपको क्या करना है', safety: 'सावधान',

    askTitle: 'बोलकर पूछें',
    askIntro: 'माइक दबाकर हिंदी में बोलें, या हिंग्लिश या भोजपुरी जैसी बोली में लिखें। जवाब केवल नमूना नियमों S1–S7 से मिलेगा।',
    micStart: 'माइक दबाएं', micStop: 'सुन रहे हैं...', micHelpIdle: 'माइक दबाकर सवाल बोलें, या नीचे लिखें', micHelpActive: 'कृपया बोलें...',
    micUnsupported: 'इस ब्राउज़र में आवाज़ पहचान उपलब्ध नहीं है। कृपया Chrome या Edge खोलें, या लिखकर पूछें।',
    micDenied: 'माइक की अनुमति नहीं मिली। ब्राउज़र में अनुमति दें, या लिखकर पूछें।',
    micNoSpeech: 'आवाज़ सुनाई नहीं दी। फिर से बोलें या लिखकर पूछें।',
    micFailed: 'आवाज़ पहचान नहीं हो पाई। कृपया लिखकर पूछें।',
    tryAsking: 'ये सवाल आज़माएँ', placeholder: 'या यहाँ अपना सवाल लिखें...', send: 'पूछें', thinking: 'सोच रहे हैं...',
    you: 'आप', assistant: 'भूमित्र', welcome: 'नमस्ते! मैं भूमित्र हूँ। अपनी ज़मीन, खतियान या सर्वे के बारे में पूछें।',

    paperTitle: 'मेरा कागज़ समझाएं',
    paperIntro: 'नमूना पत्र चुनें, लिखाई पेस्ट करें या फ़ोटो डालें। आपको पता चलेगा कि यह क्या है, क्या करना है और कितने दिन बचे हैं।',
    samples: 'नमूना पत्र', letter: 'पत्र', pasteLabel: 'नोटिस की लिखाई पेस्ट करें', pastePlaceholder: 'नोटिस की लिखाई यहाँ पेस्ट करें...',
    explain: 'समझाएं', upload: 'फ़ोटो या फ़ाइल डालें', uploadHint: 'फ़ोटो, PDF या टेक्स्ट, 10 MB तक', reading: 'पढ़ रहे हैं...',
    paperEmpty: 'कोई नमूना पत्र चुनें, या अपना नोटिस डालें।', originalText: 'पत्र की लिखाई',
    whatItIs: 'यह क्या है', office: 'कार्यालय', reference: 'पत्र संख्या', caseNo: 'मामला संख्या', letterDate: 'पत्र की तारीख', place: 'कहाँ जमा करें',
    deadline: 'अंतिम तारीख', daysLeft: (days) => `${days} दिन बाकी`, dueToday: 'आज अंतिम दिन', daysOverdue: (days) => `शायद ${days} दिन बीत गए`, noDeadline: 'तारीख नहीं मिली',
    basis: 'कैसे गिना गया', fee: 'शुल्क', consequence: 'ध्यान दें', relatedRules: 'संबंधित नमूना नियम', notLand: 'ज़मीन का कागज़ नहीं',

    recordTitle: 'मेरी ज़मीन का रिकॉर्ड',
    recordIntro: 'ज़िला, मौज़ा और खाता चुनें। रिकॉर्ड आसान भाषा में समझाया जाएगा और लंबित काम दिखेंगे।',
    district: 'ज़िला', mauza: 'मौज़ा', khata: 'खाता नंबर', search: 'रिकॉर्ड देखें',
    pendingActions: 'ध्यान देने वाले काम', noPending: 'इस रिकॉर्ड में कोई लंबित काम नहीं दिखा।', holder: 'धारक', deceasedTag: 'स्वर्गीय',
    totalArea: 'कुल रकबा', decimals: 'डिसमिल', jamabandi: 'जमाबंदी', lastReceipt: 'आखिरी लगान रसीद', thana: 'थाना संख्या', circle: 'अंचल',
    khesra: 'खेसरा', area: 'रकबा', landType: 'प्रकार', explanation: 'आसान भाषा में',

    rulesTitle: 'नमूना नियम S1–S7',
    rulesIntro: 'भूमित्र के जवाब इन्हीं नमूना नियमों पर आधारित हैं। ये काल्पनिक हैं और केवल इस प्रोटोटाइप के लिए लिखे गए हैं।',
    glossary: 'ज़मीन के रिकॉर्ड के शब्द',

    helpTitle: 'नागरिक सहायता',
    helpIntro: 'कागज़ों की सूची, शिविर की जानकारी और धोखाधड़ी से बचने के तरीके।',
    checklists: 'कागज़ों की सूची', helpDesk: 'सहायता शिविर', fraud: 'धोखाधड़ी से बचें', faq: 'अक्सर पूछे जाने वाले सवाल', officialSites: 'सरकारी वेबसाइट',

    heroBadge: 'बिहार के नागरिकों के लिए डिजिटल सहायता सेवा',
    heroTitle: 'भूमित्र: आपकी ज़मीन, आपकी भाषा में',
    heroSubtitle: 'पढ़ना नहीं आता तो भी कोई बात नहीं। बोलकर पूछें, नोटिस दिखाएं और जानें कि क्या करना है, बिना किसी बिचौलिए के।',
    tryDemo: 'डेमो आज़माएं',
    actionAsk: 'मुझसे पूछें', actionPaper: 'मेरा कागज़ समझाएं', actionRecord: 'मेरी ज़मीन का रिकॉर्ड देखें',
    problemTitle: 'नागरिकों की समस्याएँ',
    problemPoints: [
      'ग्रामीण परिवार अक्सर यह नहीं जान पाते कि कौन सा फ़ॉर्म भरना है और कौन से कागज़ लगेंगे।',
      'सरकारी नोटिस कठिन भाषा में होते हैं, इसलिए लोग अंतिम तारीख चूक जाते हैं।',
      'जो जानकारी मुफ़्त है, उसके लिए कई लोग बिचौलियों को पैसे दे देते हैं।'
    ],
    problemCards: [
      {
        num: '01',
        title: 'फ़ॉर्म व कागज़ात की उलझन',
        text: 'ग्रामीण परिवार अक्सर यह नहीं जान पाते कि कौन सा फ़ॉर्म (प्रपत्र-S1) भरना है और वंशावली या खतियान के कौन से दस्तावेज़ साथ लगाने हैं।',
        tag: 'दस्तावेज़ अस्पष्टता',
        iconType: 'file'
      },
      {
        num: '02',
        title: 'कठिन भाषा व अंतिम तारीख',
        text: 'अंचल व सर्वे नोटिस क्लिष्ट क़ानूनी भाषा में होते हैं, जिससे नागरिक आपत्ति या अपील दर्ज करने की 15 दिनों की अनिवार्य समय-सीमा चूक जाते हैं।',
        tag: 'नियम S4: 15 दिन की मियाद',
        iconType: 'clock'
      },
      {
        num: '03',
        title: 'मुफ़्त सेवा पर बिचौलियों की वसूली',
        text: 'सर्वे की स्व-घोषणा पूर्णतः निःशुल्क होने के बावजूद सही जानकारी के अभाव में ग्रामीण नागरिक बिचौलियों को अनावश्यक पैसे दे बैठते हैं।',
        tag: 'नियम S6: पूर्णतः निःशुल्क',
        iconType: 'alert'
      }
    ],
    howTitle: 'यह कैसे काम करता है',
    howSteps: [
      { title: 'बोलें या दिखाएं', text: 'हिंदी में बोलें, या अपना सवाल या नोटिस डालें।' },
      { title: 'नियमों से जाँच', text: 'भूमित्र केवल नमूना नियमों (S1–S7) से जवाब देता है और नियम संख्या दिखाता है। समय-सीमा की गणना स्वतः की जाती है।' },
      { title: 'सुनें और कदम उठाएं', text: 'कागज़ों की सूची, अंतिम तारीख और अगला कदम बोलकर सुनें।' }
    ],
    featuresTitle: 'क्या-क्या कर सकते हैं',
    features: [
      { tab: 'ask', title: 'बोलकर पूछें', text: 'हिंदी, हिंग्लिश या भोजपुरी जैसी बोली में सवाल पूछें और जवाब सुनें।' },
      { tab: 'paper', title: 'कागज़ समझाएं', text: 'नोटिस से कार्यालय, ज़रूरी कागज़ और बचे हुए दिन जानें।' },
      { tab: 'record', title: 'ज़मीन का रिकॉर्ड', text: 'नमूना रिकॉर्ड खोजें और लंबित काम देखें।' },
      { tab: 'help', title: 'नागरिक सहायता', text: 'कागज़ों की सूची, धोखाधड़ी की चेतावनी और सवाल-जवाब।' }
    ],
    whoTitle: 'यह किसके लिए है',
    whoUsers: 'नागरिक', whoUsersText: 'ग्रामीण भू-धारक, वारिस, बटाईदार और वे सभी जिन्हें नोटिस मिला है पर समझ नहीं आता।',
    whoUsersBenefit: 'बिचौलियों पर निर्भर हुए बिना अपने कागज़ खुद समझें।',
    whoBuyers: 'संस्थाएँ', whoBuyersText: 'राजस्व विभाग, कॉमन सर्विस सेंटर और पंचायतें इसे नागरिक सहायता के रूप में दे सकते हैं।',
    whoBuyersBenefit: 'नागरिकों तक सीधी, पारदर्शी व सुलभ जानकारी पहुँचाएँ।',
    footerAbout: 'ज़मीन के रिकॉर्ड और नोटिस को आसान भाषा में समझाने वाला प्रोटोटाइप।',

    // UI/UX Upgrade Strings
    followUpsTitle: 'संबंधित सवाल',
    replayAudio: 'फिर से सुनें',
    rotate: 'घुमाएँ (90°)',
    retake: 'फ़ाइल बदलें',
    takePhoto: 'कैमरे से फ़ोटो लें',
    cameraCapture: 'फ़ोटो खींचें',
    cameraClose: 'कैमरा बंद करें',
    cameraStarting: 'कैमरा चालू हो रहा है...',
    cameraHint: 'पूरा कागज़ फ़्रेम में रखें और रोशनी अच्छी रखें।',
    cameraDenied: 'कैमरे की अनुमति नहीं मिली। ब्राउज़र में अनुमति दें, या फ़ोटो या फ़ाइल डालें।',
    cameraMissing: 'कोई कैमरा नहीं मिला। कृपया फ़ोटो या फ़ाइल डालें।',
    cameraFailed: 'कैमरा नहीं खुल पाया। कृपया फ़ोटो या फ़ाइल डालें।',
    dragDropHint: 'फ़ाइल यहाँ खींचकर लाएँ या चुनने के लिए क्लिक करें',
    fileSelected: 'फ़ाइल चुनी गई',
    stepReading: 'दस्तावेज़ पढ़ा जा रहा है...',
    stepOcr: 'लिखाई पहचानी जा रही है...',
    stepDates: 'तारीख व नियम गिने जा रहे हैं...',
    copyText: 'लिखाई कॉपी करें',
    copied: 'कॉपी हो गया!',
    searchRules: 'नियम या शब्द खोजें (जैसे: वारिस, शुल्क, नक्शा)...',
    noRulesFound: 'इस खोज के लिए कोई नियम नहीं मिला।',
    allRules: 'सभी नियम',
    catSurvey: 'स्व-घोषणा',
    catDocs: 'कागज़ात',
    catDispute: 'आपत्ति / विवाद',
    catFees: 'शुल्क व शिविर',
    mandatoryDocs: 'अनिवार्य कागज़ (सभी के लिए)',
    conditionalDocs: 'विशिष्ट परिस्थिति के कागज़',
    checklistProgress: (done, total) => `${total} में से ${done} कागज़ तैयार`,
    quickSamples: 'जल्दी जाँचें (नमूना रिकॉर्ड)',
    directAnswer: 'सीधा जवाब',
    extractedFacts: 'निकाली गई जानकारी',
    rawNoticeText: 'नोटिस की मूल लिखाई',
    voiceStateReady: 'तैयार है · माइक दबाएं',
    voiceStateListening: 'सुन रहे हैं... बोलिए',
    voiceStateProcessing: 'आवाज़ समझ रहे हैं...',
    voiceStateSpeaking: 'जवाब बोलकर सुनाया जा रहा है'
  },
  en: {
    languageLabel: 'Choose language',
    chooseLanguage: 'Choose your language',
    voiceTitle: 'Ask by speaking',
    voiceSubtitle: 'You can ask your question in your own language.',
    languageSelected: (name) => `${name} selected`,
    answerPlaying: 'Playing',
    speakingNow: 'Reading the answer aloud',
    preparingVoice: 'Preparing voice...',
    nowReading: 'Now reading',
    spokenText: 'What was read aloud',
    understanding: 'Understanding what you said...',
    heardAs: 'Language detected',
    heardWrong: 'If this is wrong, please speak again',
    micNoDevice: 'No microphone was found. Connect one, or type your question.',
    speechFailed: 'The answer could not be read aloud just now. Check the internet and press Listen again, or read the answer.',
    micRetry: 'The speech recognition service was not reachable. Please press the mic again.',
    languageFallback: 'A translation is not available right now, so this is shown in Hindi.',
    aiTranslationNote: 'This translation is by AI and has not been language-checked. Dates, numbers and rules do not change.',
    step: 'Step',
    answerFound: 'Answer found',
    answerNotFound: 'Answer not found',
    documentType: 'Document type',
    purpose: 'Purpose',
    sampleRecord: 'Fictional sample record',
    ticked: (done, total) => `${done} of ${total} ready`,
    openLabel: 'Open',
    actionAskDesc: 'Ask about the rules by voice',
    actionPaperDesc: 'Understand official notices',
    actionRecordDesc: 'See khatiyan and khesra details',
    problemSubtitle: 'The main challenges for rural families in the survey',
    howSubtitle: 'Three simple steps, with no middlemen',
    featuresSubtitle: 'What this prototype does',
    whoSubtitle: 'For citizens and institutions',
    faqSubtitle: 'About safety, language and the rules',
    brandTagline: 'Understand your land papers in your language',
    fraudBanner: 'There is no fee for the survey self-declaration. Do not pay any middleman. (Rule S6)',
    disclaimer: 'Rules S1–S7 and all records are fictional sample data. This is not actual law or legal advice.',
    navHome: 'Home', navAsk: 'Ask', navPaper: 'Explain Paper', navRecord: 'My Land', navRules: 'Rules S1–S7', navHelp: 'Help',
    toggleMenu: 'Open or close the menu',
    loading: 'Loading...',
    retry: 'Try again',
    serverDown: 'Could not reach the server. Check that the backend is running.',
    genericError: 'Something went wrong. Please try again.',
    listen: 'Listen', stop: 'Stop',
    source: 'Source', noSource: 'Not in the available rules', viaGemini: 'From Gemini AI', viaOffline: 'Offline answer', viaGuard: 'From safety check',
    documents: 'Documents needed', action: 'What you need to do', safety: 'Be careful',

    askTitle: 'Ask by voice',
    askIntro: 'Press the mic and speak in English, or type in English, Hindi or Hinglish. Answers come only from sample rules S1–S7.',
    micStart: 'Press mic', micStop: 'Listening...', micHelpIdle: 'Press the mic and speak, or type below', micHelpActive: 'Please speak...',
    micUnsupported: 'Speech recognition is not available in this browser. Please open Chrome or Edge, or type your question.',
    micDenied: 'Microphone permission was denied. Allow it in the browser, or type your question.',
    micNoSpeech: 'No speech was heard. Speak again or type your question.',
    micFailed: 'Speech could not be recognised. Please type your question.',
    tryAsking: 'Try these questions', placeholder: 'Or type your question here...', send: 'Ask', thinking: 'Thinking...',
    you: 'You', assistant: 'Bhoomitra', welcome: 'Hello! I am Bhoomitra. Ask me about your land, khatiyan or the survey.',

    paperTitle: 'Explain my paper',
    paperIntro: "Choose a sample letter, paste the text or upload a photo. You'll learn what it is, what to do and how many days are left.",
    samples: 'Sample letters', letter: 'Letter', pasteLabel: 'Paste the notice text', pastePlaceholder: 'Paste the notice text here...',
    explain: 'Explain', upload: 'Upload a photo or file', uploadHint: 'Photo, PDF or text, up to 10 MB', reading: 'Reading...',
    paperEmpty: 'Choose a sample letter, or add your own notice.', originalText: 'Letter text',
    whatItIs: 'What it is', office: 'Office', reference: 'Reference no.', caseNo: 'Case no.', letterDate: 'Letter date', place: 'Where to submit',
    deadline: 'Last date', daysLeft: (days) => `${days} days left`, dueToday: 'Last day is today', daysOverdue: (days) => `Possibly ${days} days past`, noDeadline: 'No date found',
    basis: 'How this was worked out', fee: 'Fee', consequence: 'Please note', relatedRules: 'Related sample rules', notLand: 'Not a land paper',

    recordTitle: 'My land record',
    recordIntro: 'Choose the district, mauza and khata. The record is explained in simple language, with pending actions highlighted.',
    district: 'District', mauza: 'Mauza', khata: 'Khata number', search: 'View record',
    pendingActions: 'Actions to look at', noPending: 'No pending actions were found in this record.', holder: 'Holder', deceasedTag: 'Deceased',
    totalArea: 'Total area', decimals: 'decimals', jamabandi: 'Jamabandi', lastReceipt: 'Last rent receipt', thana: 'Thana no.', circle: 'Circle',
    khesra: 'Khesra', area: 'Area', landType: 'Type', explanation: 'In simple words',

    rulesTitle: 'Sample rules S1–S7',
    rulesIntro: "Bhoomitra's answers are based on these sample rules. They are fictional and written only for this prototype.",
    glossary: 'Land-record words',

    helpTitle: 'Citizen help',
    helpIntro: 'Document checklists, help-camp information and how to avoid fraud.',
    checklists: 'Document checklists', helpDesk: 'Help camps', fraud: 'Avoid fraud', faq: 'Frequently asked questions', officialSites: 'Government websites',

    heroBadge: 'Digital Citizen Service for Bihar',
    heroTitle: 'Bhoomitra: your land, explained in your language',
    heroSubtitle: "Even if you can't read. Ask by voice, show a notice and learn what to do, with no middlemen.",
    tryDemo: 'Try the demo',
    actionAsk: 'Ask me', actionPaper: 'Explain my paper', actionRecord: 'See my land record',
    problemTitle: 'The Challenges Citizens Face',
    problemPoints: [
      "Rural families often don't know which form to fill or which documents to bring.",
      'Official notices are written in difficult language, so people miss deadlines.',
      'Many people pay middlemen for information that is free.'
    ],
    problemCards: [
      {
        num: '01',
        title: 'Form & Document Confusion',
        text: 'Rural families often do not know which form (like Prapatra-S1) to submit or which inheritance papers to attach.',
        tag: 'Unclear Requirements',
        iconType: 'file'
      },
      {
        num: '02',
        title: 'Complex Language & Deadlines',
        text: 'Official survey notices are written in dense legal terminology, causing citizens to miss the critical 15-day objection deadline.',
        tag: 'Rule S4: 15-Day Limit',
        iconType: 'clock'
      },
      {
        num: '03',
        title: 'Middlemen Exploitation for Free Services',
        text: 'Even though survey self-declaration is completely free, citizens routinely pay unnecessary fees to middlemen due to lack of clarity.',
        tag: 'Rule S6: Zero Fee',
        iconType: 'alert'
      }
    ],
    howTitle: 'How it works',
    howSteps: [
      { title: 'Speak or show', text: 'Speak your question, or add your question or notice.' },
      { title: 'Checked against rules', text: 'Bhoomitra verifies answers only against sample rules (S1–S7) and cites the exact rule. Deadlines are calculated automatically.' },
      { title: 'Listen and act', text: 'Hear the document list, last date and next step read aloud.' }
    ],
    featuresTitle: 'What you can do',
    features: [
      { tab: 'ask', title: 'Ask by voice', text: 'Ask in English, Hindi, Hinglish or Bhojpuri-style language, and hear the answer.' },
      { tab: 'paper', title: 'Explain a paper', text: 'Find the office, documents needed and days left from a notice.' },
      { tab: 'record', title: 'Land record', text: 'Search the sample records and see pending actions.' },
      { tab: 'help', title: 'Citizen help', text: 'Document checklists, fraud warnings and FAQs.' }
    ],
    whoTitle: "Who it's for",
    whoUsers: 'Citizens', whoUsersText: "Rural landholders, heirs, sharecroppers and anyone with a notice they can't understand.",
    whoUsersBenefit: 'Understand documents without depending on middlemen.',
    whoBuyers: 'Institutions', whoBuyersText: 'Revenue departments, Common Service Centres and panchayats can offer it as a citizen service.',
    whoBuyersBenefit: 'Provide accessible information to citizens.',
    footerAbout: 'A prototype that explains land records and notices in simple language.',

    // UI/UX Upgrade Strings
    followUpsTitle: 'Suggested follow-up questions',
    replayAudio: 'Replay audio',
    rotate: 'Rotate (90°)',
    retake: 'Change file',
    takePhoto: 'Take photo with camera',
    cameraCapture: 'Take photo',
    cameraClose: 'Close camera',
    cameraStarting: 'Starting the camera...',
    cameraHint: 'Keep the whole paper in the frame, in good light.',
    cameraDenied: 'Camera permission was denied. Allow it in the browser, or upload a photo or file.',
    cameraMissing: 'No camera was found. Please upload a photo or file.',
    cameraFailed: 'The camera could not be opened. Please upload a photo or file.',
    dragDropHint: 'Drag and drop file here or click to browse',
    fileSelected: 'File selected',
    stepReading: 'Reading document...',
    stepOcr: 'Recognising text...',
    stepDates: 'Calculating dates and rules...',
    copyText: 'Copy text',
    copied: 'Copied!',
    searchRules: 'Search rules or keywords (e.g. heirs, fee, map)...',
    noRulesFound: 'No rules matched this search.',
    allRules: 'All rules',
    catSurvey: 'Self-declaration',
    catDocs: 'Documents',
    catDispute: 'Disputes',
    catFees: 'Fees & Camps',
    mandatoryDocs: 'Mandatory documents (for everyone)',
    conditionalDocs: 'Conditional documents',
    checklistProgress: (done, total) => `${done} of ${total} documents ready`,
    quickSamples: 'Quick demo records',
    directAnswer: 'Direct answer',
    extractedFacts: 'Extracted details',
    rawNoticeText: 'Original notice text',
    voiceStateReady: 'Ready · Press mic',
    voiceStateListening: 'Listening... speak now',
    voiceStateProcessing: 'Processing speech...',
    voiceStateSpeaking: 'Reading answer aloud'
  }
};

// Menus stay in Hindi for Bhojpuri and Magahi; these are the phrases a speaker meets first.
// They should be checked by a native speaker before real use.
STRINGS.bho = {
  ...STRINGS.hi,
  welcome: 'प्रणाम! हम भूमित्र बानी। अपना जमीन, खतियान भा सर्वे के बारे में पूछीं।',
  micHelpIdle: 'माइक दबा के आपन सवाल बोलीं, भा नीचे लिखीं',
  micHelpActive: 'अब बोलीं...',
  voiceTitle: 'आपन बात बोल के पूछीं',
  voiceSubtitle: 'रउआ अपना भाषा में सवाल पूछ सकीले।'
};
STRINGS.mag = {
  ...STRINGS.hi,
  welcome: 'प्रणाम! हम भूमित्र ही। अपन जमीन, खतियान या सर्वे के बारे में पूछऽ।',
  micHelpIdle: 'माइक दबा के अपन सवाल बोलऽ, या नीचे लिखऽ',
  micHelpActive: 'अब बोलऽ...',
  voiceTitle: 'अपन बात बोल के पूछऽ',
  voiceSubtitle: 'तूँ अपन भाषा में सवाल पूछ सकऽ हऽ।'
};

export const LANGUAGES = [
  { code: 'hi', label: 'हिन्दी (Hindi)', short: 'हिन्दी' },
  { code: 'bho', label: 'भोजपुरी (Bhojpuri)', short: 'भोजपुरी' },
  { code: 'mag', label: 'मगही (Magahi)', short: 'मगही' },
  { code: 'en', label: 'English', short: 'English' }
];

const STORAGE_KEY = 'bhoomitra-lang';

const readStoredLang = () => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return STRINGS[stored] ? stored : 'hi';
  } catch {
    return 'hi';
  }
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(readStoredLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // The choice just won't be remembered in this browser.
    }
  }, [lang]);

  const value = useMemo(() => ({
    lang,
    t: STRINGS[lang],
    setLang
  }), [lang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);

// Turn a failed request into a message: the backend's own wording when it sent one.
export const errorMessage = (error, t) => {
  if (error?.status === 0) return t.serverDown;
  return error?.message || t.genericError;
};
