"""Static content for the Citizen Help screen. Facts come from statutory rules and official land guidance."""
from . import knowledge

CHECKLISTS = {
    "hi": [
        {"title": "सर्वे की स्व-घोषणा के लिए",
         "items": ["स्व-घोषणा पत्र (प्रपत्र-S1)", "खतियान या पुराने रिकॉर्ड की कॉपी", "ताज़ा लगान रसीद", "आधार कार्ड"],
         "sources": ["S1", "S2"]},
        {"title": "यदि ज़मीन स्वर्गीय परिवारजन के नाम है",
         "items": ["ऊपर के सभी कागज़", "वंशावली", "मृत्यु प्रमाण पत्र"],
         "sources": ["S3", "S2"]},
        {"title": "नक्शे या सीमा पर आपत्ति के लिए",
         "items": ["आपत्ति प्रपत्र (प्रपत्र-S2), प्रारूप नक्शा लगने के 15 दिन के भीतर"],
         "sources": ["S4"]},
    ],
    "en": [
        {"title": "For the survey self-declaration",
         "items": ["Self-declaration form (Prapatra-S1)", "Copy of khatiyan or old record", "Latest rent receipt", "Aadhaar card"],
         "sources": ["S1", "S2"]},
        {"title": "If the land is in a deceased relative's name",
         "items": ["All the documents above", "Vanshavali (family tree)", "Death certificate"],
         "sources": ["S3", "S2"]},
        {"title": "To object to a map or boundary",
         "items": ["Objection form (Prapatra-S2), within 15 days of the draft map being displayed"],
         "sources": ["S4"]},
    ],
}

FAQS = {
    "hi": [
        {"question": "सर्वे के लिए कौन से कागज़ चाहिए?", "answer": "खतियान या पुराने रिकॉर्ड की कॉपी, ताज़ा लगान रसीद, आधार, और ज़मीन विरासत की हो तो वंशावली (नियम S2)।"},
        {"question": "यदि रिकॉर्ड में दर्ज धारक का निधन हो गया हो तो?", "answer": "सभी वारिस वंशावली और मृत्यु प्रमाण पत्र के साथ मिलकर आवेदन कर सकते हैं (नियम S3)।"},
        {"question": "यदि ज़मीन का नक्शा गलत हो तो?", "answer": "गाँव में प्रारूप नक्शा लगने के 15 दिन के भीतर प्रपत्र-S2 में आपत्ति दें (नियम S4)।"},
        {"question": "कागज़ कहाँ जमा करें?", "answer": "जहाँ आपके नोटिस में लिखा हो, इसलिए नोटिस ध्यान से देखें या यहाँ समझ लें। सहायता शिविर अधिसूचित तारीखों पर पंचायत भवन में लगते हैं (नियम S7)।"},
        {"question": "क्या यह कानूनी सलाह है?", "answer": "नहीं। यह केवल नमूना नियमों को आसान भाषा में समझाता है। कानूनी मामलों के लिए अंचल कार्यालय से संपर्क करें।"},
        {"question": "मैं किन भाषाओं में पूछ सकता हूँ?", "answer": "आप हिंदी या अंग्रेज़ी में बोलकर, या हिंग्लिश में लिखकर पूछ सकते हैं। भोजपुरी और मगही जैसे सवाल लिखकर भी समझने की कोशिश की जाती है। जवाब सरल हिंदी या अंग्रेज़ी में मिलता है।"},
        {"question": "क्या इसका कोई पैसा लगता है?", "answer": "भूमित्र मुफ़्त है। सर्वे की स्व-घोषणा के लिए भी कोई शुल्क नहीं है (नियम S6)। किसी बिचौलिए को पैसे न दें।"},
        {"question": "जानकारी कहाँ से आती है?", "answer": "केवल दिए गए नमूना नियमों S1–S7 से। हर जवाब में नियम संख्या दिखाई जाती है। ये नियम काल्पनिक हैं, असली कानून नहीं।"},
        {"question": "यदि जवाब नियमों में न हो तो?", "answer": "भूमित्र अंदाज़ा नहीं लगाता। वह बताता है कि जानकारी उपलब्ध नहीं है और आपको अंचल कार्यालय जाने की सलाह देता है।"},
        {"question": "क्या मेरा कागज़ या डेटा सुरक्षित है?", "answer": "इस नमूना ऐप में कोई खाता नहीं बनता। लिखाई पढ़ने और समझाने के लिए कागज़ Gemini AI को भेजा जा सकता है, और समय बचाने के लिए जवाब इस कंप्यूटर पर रखे जा सकते हैं। इसलिए इसमें असली निजी कागज़ न डालें।"},
    ],
    "en": [
        {"question": "Which documents does the survey need?", "answer": "A copy of the khatiyan or old record, the latest rent receipt, Aadhaar, and the vanshavali if the land is inherited (Rule S2)."},
        {"question": "What if the recorded holder has died?", "answer": "All heirs can apply together with the vanshavali and death certificate (Rule S3)."},
        {"question": "What if the land map is wrong?", "answer": "File an objection on Prapatra-S2 within 15 days of the draft map being displayed in the village (Rule S4)."},
        {"question": "Where do I submit my documents?", "answer": "Wherever your notice says, so check your notice or have it explained here. Help camps are held at the Panchayat Bhawan on notified dates (Rule S7)."},
        {"question": "Is this legal advice?", "answer": "No. It only explains the sample rules in simple language. For legal matters, contact the Circle Office."},
        {"question": "Which languages can I use?", "answer": "You can speak in Hindi or English, or type in Hinglish. Typed Bhojpuri-style and Magahi-style questions are also understood where possible. Answers come in simple Hindi or English."},
        {"question": "Does it cost anything?", "answer": "Bhoomitra is free. The survey self-declaration also has no fee (Rule S6). Do not pay any middleman."},
        {"question": "Where does the information come from?", "answer": "Only from the provided sample rules S1–S7. Every answer shows the rule number. These rules are fictional, not actual law."},
        {"question": "What if the answer isn't in the rules?", "answer": "Bhoomitra does not guess. It says the information is not available and advises you to go to the Circle Office."},
        {"question": "Is my paper or data safe?", "answer": "This sample app creates no accounts. To read and explain your paper, it may be sent to Gemini AI, and answers may be kept on this computer to save time. So do not upload real private documents."},
    ],
}

CAMP_CHECKLIST = {
    "hi": {
        "title": "शिविर जाने से पहले",
        "items": [
            "स्व-घोषणा पत्र (प्रपत्र-S1) भर लिया", "खतियान या पुराने रिकॉर्ड की कॉपी रख ली", "ताज़ा लगान रसीद रख ली", "आधार कार्ड रख लिया",
            "ज़मीन विरासत की है तो वंशावली रख ली", "धारक का निधन हो गया है तो मृत्यु प्रमाण पत्र रख लिया",
            "शिविर की तारीख पता कर ली", "याद रखा कि स्व-घोषणा के लिए किसी को पैसे नहीं देने",
        ],
        "sources": ["S1", "S2", "S3", "S6", "S7"],
    },
    "en": {
        "title": "Before you go to the camp",
        "items": [
            "Filled in the self-declaration (Prapatra-S1)", "Packed a copy of the khatiyan or old record", "Packed the latest rent receipt", "Packed the Aadhaar card",
            "Packed the vanshavali, if the land is inherited", "Packed the death certificate, if the holder has died",
            "Found out the camp date", "Remembered not to pay anyone for the self-declaration",
        ],
        "sources": ["S1", "S2", "S3", "S6", "S7"],
    },
}

HELP_DESK = {"hi": "सहायता शिविर अधिसूचित तारीखों पर पंचायत भवन में लगते हैं।", "en": "Help camps are held at the Panchayat Bhawan on notified dates."}
FRAUD_WARNINGS = {
    "hi": ["\"नाम जुड़वाने\" के लिए पैसे माँगने वाले से बचें।", "स्व-घोषणा के लिए किसी बिचौलिए या एजेंट को पैसे न दें।", "पैसे माँगने वाले की शिकायत अंचल अधिकारी से करें।"],
    "en": ["Beware of anyone asking for money to \"get the name added\".", "Do not pay any middleman or agent for the self-declaration.", "Report anyone asking for money to the Circle Officer."],
}
OFFICIAL_SITES = [
    {"name": {"hi": "राजस्व एवं भूमि सुधार विभाग, बिहार", "en": "Department of Revenue and Land Reforms, Bihar"}, "url": "https://state.bihar.gov.in/lrc"},
    {"name": {"hi": "बिहार भूमि पोर्टल", "en": "Bihar Bhumi portal"}, "url": "https://biharbhumi.bihar.gov.in"},
    {"name": {"hi": "ई-म्यूटेशन", "en": "e-Mutation"}, "url": "https://emutation.bihar.gov.in"},
]


def content(lang: str = "hi") -> dict:
    return {
        "camp_checklist": CAMP_CHECKLIST[lang],
        "checklists": CHECKLISTS[lang],
        "help_desk": {"message": HELP_DESK[lang], "sources": ["S7"]},
        "no_fee": {"message": knowledge.FRAUD_WARNING[lang], "sources": ["S6"]},
        "fraud_warnings": FRAUD_WARNINGS[lang],
        "faqs": FAQS[lang],
        "glossary": [{"term": entry["term"][lang], "meaning": entry["meaning"][lang]} for entry in knowledge.GLOSSARY],
        "official_sites": [{"name": site["name"][lang], "url": site["url"]} for site in OFFICIAL_SITES],
        "disclaimer": knowledge.DISCLAIMER[lang],
    }
