import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { formatMoney } from '../../utils/money'

export function PageTitle({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) { return <div className="page-title"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1></div>{children}</div> }
export function Field({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) { const id = useId(); return <label className="field" htmlFor={props.id ?? id}><span>{label}</span><input id={id} name={props.name ?? id} autoComplete="off" {...props}/></label> }
export function Money({ value, strong = false }: { value: number; strong?: boolean }) { return <span className={strong ? 'money-strong' : ''}>{formatMoney(value)}</span> }
