import React from "react";

interface MyBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

const MyBtn: React.FC<MyBtnProps> = ({ 
  children, 
  onClick,
  disabled = false,
  type = "button",
  ...props 
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        text-[#979797] font-light border-[1px] border-[#979797]/30 
        px-5 py-2 rounded-xl transition-all
        ${disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:border-[#979797]/60 hover:bg-[#979797]/5'
        }
      `}
      {...props}
    >
      {children}
    </button>
  );
};

export default MyBtn;