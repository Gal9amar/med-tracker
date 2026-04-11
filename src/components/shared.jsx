export function Input({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  )
}

export function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={inputStyle}>
        <option value="">בחר...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

export const labelStyle = {
  display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 4, fontFamily: 'Heebo'
}
export const inputStyle = {
  width: '100%', background: '#21262d', border: '1px solid #30363d',
  borderRadius: 8, padding: '10px 12px', color: '#e6edf3',
  fontSize: 14, fontFamily: 'Heebo', outline: 'none', direction: 'rtl'
}
export const btnPrimary = {
  background: '#388bfd', color: '#fff', border: 'none', borderRadius: 8,
  padding: '10px 16px', fontSize: 14, fontWeight: 600, fontFamily: 'Heebo',
  cursor: 'pointer', width: '100%'
}
export const overlay = {
  position: 'fixed', inset: 0, background: '#00000088', zIndex: 100,
  display: 'flex', alignItems: 'flex-end'
}
export const sheet = {
  background: '#161b22', borderRadius: '16px 16px 0 0', padding: 20,
  width: '100%', maxHeight: '90vh', overflowY: 'auto', border: '1px solid #30363d'
}
