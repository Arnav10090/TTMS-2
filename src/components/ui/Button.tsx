import { ButtonHTMLAttributes } from 'react'

export default function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = '', ...rest } = props
  return (
    <button
      {...rest}
      className={
        'px-3 py-2 rounded-ui bg-cssPrimary text-white shadow hover:opacity-90 active:translate-y-[1px] transition ' +
        className
      }
    />
  )
}
