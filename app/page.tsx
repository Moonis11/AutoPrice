"use client";

import { useState } from "react";
import type { FormEvent } from "react";

type ValuationResponse = {
  estimated_price: number;
  estimated_range: { lower: number; upper: number };
  currency: string;
  model_metrics?: { rows?: number; mae_uzs?: number; r2?: number };
  uncertainty_note?: string;
  disclaimer?: string;
};

const money = (value: number) =>
  new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 }).format(value) + " so'm";

export default function Home() {
  const [form, setForm] = useState({
    make: "Chevrolet",
    model: "",
    year: "2021",
    mileage_km: "50000",
    transmission: "",
    fuel_type: "",
    region: "Toshkent shahri",
    condition: "Yaxshi",
  });
  const [result, setResult] = useState<ValuationResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    try {
      const response = await fetch(api + "/api/v1/valuation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          year: Number(form.year),
          mileage_km: Number(form.mileage_km),
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.detail || "Baholash vaqtida xatolik yuz berdi.");
      }
      setResult(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Server bilan bog'lanib bo'lmadi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <nav className="nav">
        <a className="brand" href="#"><span className="brand-mark">A</span> AutoPrice</a>
        <span className="nav-note">O‘zbekiston avtomobil bozori</span>
      </nav>

      <section className="hero">
        <div className="eyebrow"><span /> Aqlli avtomobil baholash</div>
        <h1>Avtomobilingiz<br /><em>qancha turadi?</em></h1>
        <p className="hero-copy">Mashina ma’lumotlarini kiriting. AutoPrice bozor ma’lumotlari asosida taxminiy narxni hisoblashga yordam beradi.</p>
      </section>

      <section className="workspace">
        <form className="form-card" onSubmit={submit}>
          <div className="card-heading">
            <div><span className="step">01 / AVTOMOBIL</span><h2>Ma’lumotlarni kiriting</h2></div>
            <span className="required-note">* Majburiy</span>
          </div>

          <div className="field-grid">
            <label>Marka *
              <select value={form.make} onChange={(e) => update("make", e.target.value)}>
                {["Chevrolet", "BYD", "Kia", "Hyundai", "Toyota", "Lada", "Chery", "Volkswagen", "Boshqa"].map((v) => <option key={v}>{v}</option>)}
              </select>
            </label>
            <label>Model *
              <input required value={form.model} onChange={(e) => update("model", e.target.value)} placeholder="Masalan, Cobalt" />
            </label>
            <label>Ishlab chiqarilgan yil *
              <input required type="number" min="1980" max="2035" value={form.year} onChange={(e) => update("year", e.target.value)} />
            </label>
            <label>Yurgan masofasi (km) *
              <input required type="number" min="0" max="1000000" value={form.mileage_km} onChange={(e) => update("mileage_km", e.target.value)} />
            </label>
            <label>Uzatmalar qutisi
              <select value={form.transmission} onChange={(e) => update("transmission", e.target.value)}>
                <option value="">Tanlanmagan</option><option>Avtomat</option><option>Mexanika</option><option>Variator</option><option>Robot</option>
              </select>
            </label>
            <label>Yoqilg‘i turi
              <select value={form.fuel_type} onChange={(e) => update("fuel_type", e.target.value)}>
                <option value="">Tanlanmagan</option><option>Benzin</option><option>Gaz</option><option>Gibrid</option><option>Elektr</option><option>Dizel</option>
              </select>
            </label>
            <label>Hudud
              <select value={form.region} onChange={(e) => update("region", e.target.value)}>
                {["Toshkent shahri", "Toshkent viloyati", "Samarqand", "Farg‘ona", "Andijon", "Namangan", "Buxoro", "Qashqadaryo", "Surxondaryo", "Xorazm", "Navoiy", "Jizzax", "Sirdaryo", "Qoraqalpog‘iston"].map((v) => <option key={v}>{v}</option>)}
              </select>
            </label>
            <label>Umumiy holati
              <select value={form.condition} onChange={(e) => update("condition", e.target.value)}>
                <option>Yaxshi</option><option>A’lo</option><option>O‘rtacha</option><option>Ta’mirtalab</option>
              </select>
            </label>
          </div>

          <button className="submit" type="submit" disabled={loading || !form.model.trim()}>
            {loading ? "Hisoblanmoqda..." : "Avtomobil narxini baholash"} <span>↗</span>
          </button>
          <p className="privacy">Ma’lumotlar hozircha faqat baholash so‘rovi uchun ishlatiladi.</p>
        </form>

        <aside className="result-card" aria-live="polite">
          <span className="step">02 / NATIJA</span>
          {result ? (
            <div className="result-content">
              <div className="result-icon">✓</div>
              <p className="result-label">Taxminiy bozor narxi</p>
              <div className="result-price">{money(result.estimated_price)}</div>
              <div className="range-box"><span>Taxminiy oraliq</span><strong>{money(result.estimated_range.lower)} – {money(result.estimated_range.upper)}</strong></div>
              <p className="fine-print">{result.uncertainty_note}</p>
              <p className="fine-print">{result.disclaimer}</p>
            </div>
          ) : (
            <div className="empty-result">
              <div className="car-illustration">⌁</div>
              <h3>Baholash natijasi shu yerda chiqadi</h3>
              <p>Avtomobil ma’lumotlarini to‘ldiring va baholashni boshlang.</p>
              {error && <div className="error">{error}</div>}
              <div className="result-foot"><span>UZ</span><span>UZS · O‘zbekiston so‘mi</span></div>
            </div>
          )}
          {result && <button className="reset" onClick={() => { setResult(null); setError(""); }}>Yangi baholash ↗</button>}
        </aside>
      </section>

      <section className="disclaimer">
        <strong>Izoh:</strong> AutoPrice hozir MVP sinov bosqichida. Haqiqiy bozor datasetiga ulanmaguncha model narx chiqarmaydi. Keyingi natijalar e’lon narxlariga asoslangan taxmin bo‘ladi, yakuniy sotuv narxi yoki ekspert xulosasi emas.
      </section>
      <footer><span>AutoPrice © 2026</span><span>Where data meets the market.</span></footer>
    </main>
  );
}
