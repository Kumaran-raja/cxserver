import React, { forwardRef } from "react";

interface FloatingInputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    id: string;
    label: string;
    err: string;
}

const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
    (
        {
            id,
            label,
            autoFocus = false,
            type,
            err,
            className,
            value,
            onChange,
            onKeyDown,
        },
        ref
    ) => {
        return (
            <div>
                <div className="relative w-full">
                    <input
                        ref={ref}
                        type={type}
                        id={id}
                        value={value}
                        onChange={onChange}
                        onKeyDown={onKeyDown}
                        autoFocus={autoFocus}
                        placeholder=" "
                        autoComplete="off"
                        className={`block px-2.5 pb-2.5 pt-3 w-full text-sm text-foreground/90 rounded-lg border border-ring/80 appearance-none tracking-wide dark:bg-dark dark:text-dark-9
              focus:outline-none focus:ring-2 focus:ring-ring/80 duration-300 peer ${className || ""} ${
                            err ? "bg-input-warning" : "bg-transparent"
                        }`}
                    />

                    <label
                        htmlFor={id}
                        className={`absolute text-sm text-foreground/50 duration-300 transform -translate-y-4 scale-75 top-2 origin-[0] px-2
              peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 whitespace-nowrap
              peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-2 pointer-events-none
              ${err ? "bg-input-warning" : "bg-background"}`}
                    >
                        {label}
                    </label>
                </div>
            </div>
        );
    }
);

FloatingInput.displayName = "FloatingInput";

export default FloatingInput;
