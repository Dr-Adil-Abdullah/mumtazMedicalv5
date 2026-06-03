export default function Card({ children, className = '' }) {
  return <div className={`glass rounded-3xl p-5 shadow-soft ${className}`}>{children}</div>;
}
