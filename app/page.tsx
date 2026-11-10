"use client";

import { useEffect, useMemo, useState } from "react";

type Answer = string | string[];
type Question = {
  key: string;
  title: string;
  hint: string;
  type: "select" | "text" | "number" | "multi";
  options?: string[];
  required?: boolean;
};

const CATALOG: Record<string, string[]> = {
  Chevrolet: ["Cobalt", "Damas", "Labo", "Nexia 3", "Gentra", "Lacetti", "Spark", "Matiz", "Onix", "Tracker", "Captiva", "Malibu", "Equinox", "Traverse", "Tahoe", "Orlando", "Epica"],
  BYD: ["Song Plus", "Song Pro", "Chazor", "Seagull", "Yuan Up", "Han", "Qin Plus", "Destroyer 05", "Tang", "E2"],
  Kia: ["K5", "K8", "Sonet", "Seltos", "Sportage", "Sorento", "Carnival", "Cerato", "Rio", "Picanto"],
  Hyundai: ["Elantra", "Sonata", "Tucson", "Santa Fe", "Creta", "Accent", "Staria", "Palisade", "Venue"],
  Toyota: ["Camry", "Corolla", "RAV4", "Prado", "Land Cruiser", "Hilux", "Highlander", "Avalon"],
  Chery: ["Tiggo 2", "Tiggo 4", "Tiggo 7", "Tiggo 8", "Arrizo 6", "Arrizo 8"],
  Haval: ["Jolion", "H6", "M6", "Dargo", "H9"],
  Geely: ["Coolray", "Monjaro", "Atlas", "Emgrand", "Geometry C"],
  Jetour: ["X70", "X70 Plus", "X90", "T2", "Dashing"],
  Lada: ["Vesta", "Granta", "Largus", "Niva Travel", "Niva Legend", "XRAY"],
  Volkswagen: ["Caddy", "Polo", "Jetta", "Tiguan", "Passat", "Teramont"],
  Renault: ["Logan", "Duster", "Kaptur", "Sandero"],
  Honda: ["Civic", "Accord", "CR-V", "HR-V"],
  BMW: ["3 Series", "5 Series", "7 Series", "X3", "X5", "X6"],
  "Mercedes-Benz": ["C-Class", "E-Class", "S-Class", "GLC", "GLE", "GLS", "Sprinter"],
  Lexus: ["ES", "RX", "NX", "LX", "GX"],
  Audi: ["A4", "A6", "Q5", "Q7"],
  Nissan: ["X-Trail", "Patrol", "Qashqai", "Altima"],
  Mazda: ["Mazda 3", "Mazda 6", "CX-5", "CX-9"],
  Mitsubishi: ["Outlander", "Pajero", "L200", "ASX"],
  Ford: ["Transit", "Explorer", "Mustang", "Mondeo"],
  Isuzu: ["D-Max", "NQR", " NPR"],
  Boshqa: ["Boshqa model"],
};

const BASE_QUESTIONS: Question[] = [
  { key: "make", title: "Avtomobil markasi qaysi?", hint: "O‘zbekistonda uchraydigan markalardan tanlang.", type: "select", options: Object.keys(CATALOG), required: true },
  { key: "model", title: "Modelini tanlang", hint: "Ro‘yxatda bo‘lmasa, nomini qo‘lda kiriting.", type: "select", required: true },
  { key: "year", title: "Ishlab chiqarilgan yili?", hint: "Texnik pasportdagi yilni kiriting.", type: "number", required: true },
  { key: "mileage_km", title: "Necha kilometr yurgan?", hint: "Probegni km hisobida kiriting.", type: "number", required: true },
  { key: "region", title: "Avtomobil qaysi hududda?", hint: "Hozir sotilayotgan yoki joylashgan hudud.", type: "select", options: ["Toshkent shahri", "Toshkent viloyati", "Samarqand", "Farg‘ona", "Andijon", "Namangan", "Buxoro", "Qashqadaryo", "Surxondaryo", "Xorazm", "Navoiy", "Jizzax", "Sirdaryo", "Qoraqalpog‘iston"], required: true },
  { key: "transmission", title: "Uzatmalar qutisi qanday?", hint: "Avtomobil transmissiyasi turini tanlang.", type: "select", options: ["Avtomat", "Mexanika", "Variator", "Robot", "Boshqa"] },
  { key: "fuel_type", title: "Yoqilg‘i turi qaysi?", hint: "Asosiy yoqilg‘i turini belgilang.", type: "select", options: ["Benzin", "Metan", "Propan", "Benzin + gaz", "Dizel", "Gibrid", "Elektr"] },
  { key: "condition", title: "Umumiy holatini baholang", hint: "Sotuvchi bergan dastlabki baho. Keyingi savollar aniqlashtiradi.", type: "select", options: ["A’lo", "Yaxshi", "O‘rtacha", "Ta’mirtalab"] },
  { key: "accident_count", title: "Necha marta avariyaga uchragan?", hint: "Aniq bilmasangiz, “Bilmayman”ni tanlang.", type: "select", options: ["0", "1", "2", "3", "4 yoki undan ko‘p", "Bilmayman"] },
  { key: "accident_details", title: "Avariya haqida qo‘shimcha ma’lumot", hint: "Qachon va qaysi tomondan urilganini yozing. Bo‘lmasa, “Ma’lumot yo‘q”.", type: "text" },
  { key: "damaged_parts", title: "Qaysi qismlari shikastlangan?", hint: "Bir nechta javobni tanlash mumkin.", type: "multi", options: ["Old bamper", "Orqa bamper", "Kaput", "Bagaj qopqog‘i", "Old qanot", "Orqa qanot", "Eshiklar", "Tom", "Lonjeron", "Ustunlar", "Ma’lumot yo‘q"] },
  { key: "replaced_parts", title: "Qaysi qismlari almashtirilgan?", hint: "Faqat almashtirilgani ma’lum bo‘lgan qismlarni belgilang.", type: "multi", options: ["Bamper", "Kaput", "Bagaj qopqog‘i", "Qanot", "Eshik", "Faralar", "Radiator", "Oyna", "Lonjeron", "Boshqa", "Almashtirilmagan", "Bilmayman"] },
  { key: "painted_parts", title: "Qaysi qismlari bo‘yalgan?", hint: "Bo‘yalgan panellarni belgilang.", type: "multi", options: ["Kaput", "Bagaj", "Old chap qanot", "Old o‘ng qanot", "Orqa chap qanot", "Orqa o‘ng qanot", "Old chap eshik", "Old o‘ng eshik", "Orqa chap eshik", "Orqa o‘ng eshik", "Tom", "Bo‘yalmagan", "Bilmayman"] },
  { key: "welding_rust", title: "Payvandlash yoki zang bormi?", hint: "Kuzovdagi kesish, payvandlash va zang holati.", type: "select", options: ["Yo‘q", "Payvandlash bor", "Zang bor", "Ikkalasi ham bor", "Tekshirilmagan"] },
  { key: "airbag_status", title: "Airbaglar holati qanday?", hint: "Xavfsizlik yostiqchalari ishlash holati.", type: "select", options: ["Ochilgan emas, ishlaydi", "Avariya vaqtida ochilgan", "Almashtirilgan", "Ishlamaydi yoki xato chirog‘i yonadi", "Tekshirilmagan"] },
  { key: "seatbelt_status", title: "Xavfsizlik kamarlari holati?", hint: "Kamar va tortgichlar (pretensioner) holati.", type: "select", options: ["Hammasi ishlaydi", "Ta’mirlangan/almashtirilgan", "Nosoz", "Tekshirilmagan"] },
  { key: "owner_count", title: "Nechta egasi bo‘lgan?", hint: "Hujjatdagi egalik almashishlariga qarab kiriting.", type: "select", options: ["1", "2", "3", "4", "5 yoki undan ko‘p", "Bilmayman"] },
  { key: "usage_type", title: "Avtomobil qanday ishlatilgan?", hint: "Avvalgi foydalanish turini tanlang.", type: "select", options: ["Shaxsiy", "Taksi", "Korporativ/xizmat", "Ijara", "Aralash", "Bilmayman"] },
  { key: "service_history", title: "Servis tarixi bormi?", hint: "Moy va ehtiyot qismlar almashinuvi yozuvlari.", type: "select", options: ["To‘liq servis tarixi bor", "Qisman bor", "Yo‘q", "Bilmayman"] },
  { key: "mileage_verified", title: "Probeg tasdiqlanganmi?", hint: "Servis yozuvlari yoki diagnostika bilan solishtirilganmi?", type: "select", options: ["Ha, tasdiqlangan", "Yo‘q", "Shubha bor", "Tekshirilmagan"] },
  { key: "engine_condition", title: "Dvigatel holati qanday?", hint: "Ovoz, tutun, moy yeyishi va diagnostika bo‘yicha.", type: "select", options: ["Yaxshi", "Mayda muammo bor", "Ta’mir talab", "Tekshirilmagan"] },
  { key: "battery_condition", title: "Yuqori kuchlanishli batareya holati qanday?", hint: "Elektr yoki gibrid avtomobil batareyasining umumiy holati.", type: "select", options: ["Yaxshi", "Sig‘imi pasaygan", "Nosozlik bor", "Tekshirilmagan"] },
  { key: "battery_soh", title: "Batareya sog‘ligi (SOH) necha foiz?", hint: "Diagnostika hisobotida ko‘rsatilgan qiymat. Bilmasangiz bo‘sh qoldiring.", type: "number" },
  { key: "electric_range", title: "To‘liq quvvatda qancha masofa yuradi?", hint: "Amalda bir marta to‘liq quvvatlash bilan bosib o‘tadigan masofa (km).", type: "number" },
  { key: "charging_status", title: "Quvvatlash tizimi holati qanday?", hint: "Quvvatlash porti va kabel bilan bog‘liq holat.", type: "select", options: ["Muammosiz ishlaydi", "Sekin quvvat oladi", "Nosozlik bor", "Tekshirilmagan"] },
  { key: "electric_motor_condition", title: "Elektromotor holati qanday?", hint: "Shovqin, qizish va diagnostika natijasi.", type: "select", options: ["Yaxshi", "Mayda muammo bor", "Ta’mir talab", "Tekshirilmagan"] },
  { key: "gas_equipment_status", title: "Gaz uskunasi holati qanday?", hint: "Metan yoki propan uskunasi, ballon va hujjatlari.", type: "select", options: ["Yaxshi, hujjatlari joyida", "Tekshiruv muddati yaqin", "Nosozlik bor", "Gaz uskunasi yo‘q", "Tekshirilmagan"] },
  { key: "gas_cylinder_date", title: "Gaz ballonining oxirgi tekshiruv sanasi", hint: "Faqat metan/propan uskunasi bo‘lsa kiriting.", type: "text" },
  { key: "gearbox_condition", title: "Karobka holati qanday?", hint: "Urilish, kechikish yoki shovqin bormi?", type: "select", options: ["Yaxshi", "Mayda muammo bor", "Ta’mir talab", "Tekshirilmagan"] },
  { key: "suspension_condition", title: "Yurish qismi holati?", hint: "Amortizator, sharovoy va boshqa qismlar.", type: "select", options: ["Yaxshi", "Mayda ta’mir kerak", "Jiddiy ta’mir kerak", "Tekshirilmagan"] },
  { key: "brake_condition", title: "Tormoz tizimi holati?", hint: "Tormoz disklari, kolodka va ABS.", type: "select", options: ["Yaxshi", "Ta’mir kerak", "Nosoz", "Tekshirilmagan"] },
  { key: "leaks", title: "Suyuqlik sizishi bormi?", hint: "Moy, antifriz yoki boshqa suyuqliklar.", type: "select", options: ["Yo‘q", "Moy sizadi", "Antifriz sizadi", "Boshqa suyuqlik", "Tekshirilmagan"] },
  { key: "tires_condition", title: "Shinalar holati qanday?", hint: "To‘rtta shinaning umumiy eskirish darajasi.", type: "select", options: ["Yaxshi", "O‘rtacha", "Almashtirish kerak", "Har xil holatda", "Tekshirilmagan"] },
  { key: "electronics_condition", title: "Elektronika va konditsioner ishlaydimi?", hint: "Konditsioner, oynalar, sensorlar va panel.", type: "select", options: ["Hammasi ishlaydi", "Ayrim nosozliklar bor", "Bir nechta tizim ishlamaydi", "Tekshirilmagan"] },
  { key: "documents_status", title: "Hujjatlari joyidami?", hint: "Texnik pasport va egalik hujjatlari.", type: "select", options: ["To‘liq va joyida", "Ayrim hujjatlar yetishmaydi", "Muammo bor", "Tekshirilmagan"] },
  { key: "legal_restrictions", title: "Garov, taqiq yoki jarima muammosi bormi?", hint: "Rasmiy manba orqali alohida tekshirish talab etiladi.", type: "select", options: ["Yo‘q, tekshirilgan", "Bor", "Tekshirilmagan"] },
  { key: "vin", title: "VIN-kodni kiriting (ixtiyoriy)", hint: "17 belgili kuzov identifikatsiya raqami. Uni ommaga ko‘rsatmaymiz.", type: "text" },
  { key: "notes", title: "Qo‘shimcha izoh bormi?", hint: "Komplektatsiya, kalitlar soni, qo‘shimcha jihozlar yoki boshqa muhim ma’lumotlar.", type: "text" },
];

const initial: Record<string, Answer> = {
  make: "Chevrolet", model: "Cobalt", year: "2021", mileage_km: "50000",
  region: "Toshkent shahri", transmission: "Avtomat", fuel_type: "Benzin",
  condition: "Yaxshi",
};

const money = (value: number) =>
  new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 }).format(value) + " so‘m";

export default function Home() {
  const [answers, setAnswers] = useState<Record<string, Answer>>(initial);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [modelImage, setModelImage] = useState("");

  const questions = useMemo(() => {
    const accidentRelated = new Set([
      "accident_details", "damaged_parts", "replaced_parts",
      "painted_parts", "welding_rust", "airbag_status",
    ]);
    const fuel = String(answers.fuel_type || "");
    const isElectric = fuel === "Elektr";
    const isHybrid = fuel === "Gibrid";
    const hasGas = ["Metan", "Propan", "Benzin + gaz"].includes(fuel);

    return BASE_QUESTIONS.filter((item) => {
      if (answers.accident_count === "0" && accidentRelated.has(item.key)) return false;

      // Electric cars do not use a petrol/diesel engine or fuel leak checks.
      if (isElectric && ["engine_condition", "leaks", "gas_equipment_status", "gas_cylinder_date"].includes(item.key)) return false;

      // Combustion-only checks are hidden for pure EVs; hybrid cars keep engine checks.
      if (!isElectric && ["battery_condition", "battery_soh", "electric_range", "charging_status", "electric_motor_condition"].includes(item.key)) return false;

      // Gas equipment questions appear only when gas is selected.
      if (!hasGas && ["gas_equipment_status", "gas_cylinder_date"].includes(item.key)) return false;

      // Pure EVs use an electric drive unit, not a conventional gearbox inspection.
      if (isElectric && item.key === "gearbox_condition") return false;
      return true;
    });
  }, [answers.accident_count, answers.fuel_type]);

  useEffect(() => {
    setStep((current) => Math.min(current, questions.length - 1));
  }, [questions.length]);
  const question = questions[step];
  const currentValue = answers[question.key] ?? (question.type === "multi" ? [] : "");
  const modelOptions = CATALOG[String(answers.make || "Chevrolet")] || [];
  const imageMake = String(answers.make || "car");
  const imageModel = String(answers.model || "sedan");

  useEffect(() => {
    let active = true;
    setImageFailed(false);
    setModelImage(`https://loremflickr.com/1000/650/car,${encodeURIComponent(imageMake)},${encodeURIComponent(imageModel)}`);
    const title = encodeURIComponent(`${imageMake} ${imageModel}`.replace(/ /g, "_"));
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        const image = data?.thumbnail?.source || data?.originalimage?.source;
        if (active && image) setModelImage(image);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [imageMake, imageModel]);

  function setAnswer(key: string, value: Answer) {
    setAnswers((old) => ({ ...old, [key]: value }));
    setError("");
    if (key === "make") {
      setAnswers((old) => ({ ...old, make: value, model: "" }));
      setImageFailed(false);
    }
  }

  function canContinue() {
    if (!question.required) return true;
    if (Array.isArray(currentValue)) return currentValue.length > 0;
    return String(currentValue).trim().length > 0;
  }

  async function finish() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const api = process.env.NEXT_PUBLIC_API_URL || "";
      const payload = {
        ...answers,
        year: Number(answers.year),
        mileage_km: Number(answers.mileage_km),
      };
      const response = await fetch(api + "/api/v1/valuation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail || "Baholashda xatolik yuz berdi.");
      setResult(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Server bilan bog‘lanib bo‘lmadi.");
    } finally {
      setLoading(false);
    }
  }

  function next() {
    if (!canContinue()) {
      setError("Iltimos, javobni tanlang yoki kiriting.");
      return;
    }
    if (step < questions.length - 1) setStep((s) => s + 1);
    else void finish();
  }

  function toggleMulti(option: string) {
    const selected = Array.isArray(currentValue) ? currentValue : [];
    const next = selected.includes(option) ? selected.filter((v) => v !== option) : [...selected.filter((v) => !["Yo‘q", "Bo‘yalmagan", "Almashtirilmagan"].includes(v)), option];
    setAnswer(question.key, next);
  }

  function reset() {
    setAnswers(initial);
    setStep(0);
    setResult(null);
    setError("");
    setImageFailed(false);
  }

  return (
    <main className="wizard-shell">
      <header className="wizard-nav">
        <a className="brand" href="/"><span className="brand-mark">A</span> AutoPrice</a>
        <span className="nav-note">O‘zbekiston avtomobil bozori</span>
      </header>

      {!result ? (
        <section className="wizard">
          <div className="wizard-top">
            <div><span className="eyebrow">AQLLI AVTOMOBIL BAHOLASH</span><h1>Avtomobil haqida<br/><em>birgalikda bilib olamiz.</em></h1></div>
            <div className="progress-count">{step + 1}<span> / {questions.length}</span></div>
          </div>
          <div className="progress-track"><div style={{ width: `${((step + 1) / questions.length) * 100}%` }} /></div>
          <div className="question-layout">
            <section className="question-panel">
              <span className="question-kicker">SAVOL {String(step + 1).padStart(2, "0")}</span>
              <h2>{question.title}</h2>
              <p className="question-hint">{question.hint}</p>

              {question.type === "select" && (
                <div className="choice-list">
                  {(question.key === "model" ? modelOptions : question.options || []).map((option) => (
                    <button type="button" key={option} className={currentValue === option ? "choice selected" : "choice"} onClick={() => setAnswer(question.key, option)}>
                      <span>{option}</span><i>{currentValue === option ? "✓" : "＋"}</i>
                    </button>
                  ))}
                  {question.key === "model" && <input className="other-model" value={typeof currentValue === "string" && !modelOptions.includes(currentValue) ? currentValue : ""} onChange={(e) => setAnswer("model", e.target.value)} placeholder="Model ro‘yxatda yo‘q — nomini yozing"/>}
                </div>
              )}

              {question.type === "multi" && (
                <div className="choice-grid">
                  {(question.options || []).map((option) => {
                    const checked = Array.isArray(currentValue) && currentValue.includes(option);
                    return <button type="button" key={option} className={checked ? "choice selected" : "choice"} onClick={() => toggleMulti(option)}><span>{option}</span><i>{checked ? "✓" : "+"}</i></button>;
                  })}
                </div>
              )}

              {(question.type === "text" || question.type === "number") && (
                <input className="answer-input" type={question.type} value={String(currentValue)} onChange={(e) => setAnswer(question.key, e.target.value)} placeholder={question.type === "number" ? "Raqam kiriting" : "Javobingizni yozing"} min={question.key === "year" ? 1980 : 0} max={question.key === "year" ? 2035 : 1000000}/>
              )}

              {error && <p className="wizard-error">{error}</p>}
              <div className="wizard-actions">
                <button type="button" className="back-button" onClick={() => step > 0 ? setStep((s) => s - 1) : reset()}>{step === 0 ? "Boshidan" : "← Orqaga"}</button>
                <button type="button" className="next-button" disabled={loading} onClick={next}>{loading ? "Hisoblanmoqda..." : step === questions.length - 1 ? "Natijani ko‘rish" : "Davom etish →"}</button>
              </div>
              <p className="wizard-footnote">Javoblar ketma-ket olinadi. Bilmagan savollaringizda “Bilmayman” yoki “Tekshirilmagan”ni tanlang.</p>
            </section>

            <aside className="vehicle-preview">
              <div className="preview-image-wrap">
                {!imageFailed ? <img src={modelImage} alt={`${answers.make || "Avtomobil"} ${answers.model || ""} avtomobil rasmi`} onError={() => setImageFailed(true)}/> : <div className="preview-fallback">AUTO<br/>PRICE</div>}
              </div>
              <div className="preview-caption"><span>Tanlangan avtomobil</span><strong>{String(answers.make || "Marka")} {String(answers.model || "Model")}</strong><small>{String(answers.year || "Yil")} · {String(answers.mileage_km || "—")} km</small></div>
              <p className="preview-note">Rasm namunaviy bo‘lishi mumkin. Aniq komplektatsiya va kuzov ko‘rinishi bilan farq qilishi mumkin.</p>
            </aside>
          </div>
        </section>
      ) : (
        <section className="report">
          <div className="report-heading"><span className="eyebrow">AUTOPRICE HISOBOTI</span><h1>{String(answers.make)} {String(answers.model)}</h1><p>{String(answers.year)} · {String(answers.mileage_km)} km · {String(answers.region)}</p></div>
          <div className="report-grid">
            <div className="report-main">
              {!imageFailed && <img className="report-car" src={modelImage} alt={`${answers.make} ${answers.model}`} onError={() => setImageFailed(true)}/>}
              <span className="question-kicker">TAXMINIY BOZOR NARXI</span>
              <strong className="report-price">{money(result.estimated_price)}</strong>
              <div className="range-box"><span>Taxminiy oraliq</span><b>{money(result.estimated_range.lower)} – {money(result.estimated_range.upper)}</b></div>
              <p className="report-disclaimer">{result.disclaimer || "Bu statistik taxmin, yakuniy bitim narxi emas."}</p>
              <p className="report-disclaimer">{result.uncertainty_note}</p>
            </div>
            <div className="report-details"><h2>Avtomobil holati</h2>{questions.map((q) => {
              const v = answers[q.key];
              if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) return null;
              return <div className="detail-row" key={q.key}><span>{q.title}</span><b>{Array.isArray(v) ? v.join(", ") : String(v)}</b></div>;
            })}</div>
          </div>
          <button className="next-button new-check" onClick={reset}>Yangi avtomobilni baholash ↗</button>
        </section>
      )}
      <footer className="wizard-footer"><span>AutoPrice © 2026</span><span>Taxminiy baholash · Yakuniy ekspert xulosasi emas</span></footer>
    </main>
  );
}
