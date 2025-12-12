import {
    Plus,
    Minus,
    Edit,
    Trash2,
    Eye,
    ChevronDown,
    ChevronUp,
    X,
    Search,
    ArrowUpWideNarrow,
    ArrowDownWideNarrow,
    EllipsisVertical,
    Filter,
    PrinterIcon,
    LucideFileJson2,
    ExpandIcon,
    ChevronRight,
    ChevronLeft,
    SortAsc,
    UserCircle2,
    LucideShoppingCart,
    Heart,
    LogIn,
    LogOut,
    UserPlus2Icon,
    AlignCenter,
    AlignJustify,
    AlignLeft,
    AlignRight,
    Pencil,
    Eraser,

} from "lucide-react";
import { GrClear } from "react-icons/gr";
import { IoIosArrowUp, IoIosUndo, IoIosRedo, IoIosSave   } from "react-icons/io";
import { IoChevronDown, IoGrid  } from "react-icons/io5";
import React from "react";
import { FiLink } from "react-icons/fi";
import { LuCaseUpper } from "react-icons/lu";
import { RxLetterCaseLowercase } from "react-icons/rx";
import { GrUnderline } from "react-icons/gr";
import { FaBold, FaListOl, FaListUl, FaItalic, FaVideo,FaThList  } from "react-icons/fa";
import { FaImage, FaTableCells } from "react-icons/fa6";
import { MdOutlineFormatStrikethrough } from "react-icons/md";
import { Link } from '@inertiajs/react';
import { GiArrowCursor } from "react-icons/gi";
type ButtonProps = {
    icon: string;
    path?: string;
    className?: string;
    onClick?: React.MouseEventHandler<Element>;
    onMouseEnter?: (
        event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>
    ) => void;
    onMouseLeave?: (
        event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>
    ) => void;
    onMouseDown?: React.MouseEventHandler<HTMLButtonElement>;
    children?: React.ReactNode;
    disabled?: boolean;
    label?: string;
    fontSize?: string;
};

const iconMap: Record<string, React.ReactNode> = {
    plus: <Plus size={18} />,
    minus: <Minus size={18} />,
    edit: <Edit size={18} />,
    delete: <Trash2 size={18} />,
    view: <Eye size={18} />,
    chevronDown: <ChevronDown size={18} />,
    chevronUp: <ChevronUp size={18} />,
    close: <X size={18} />,
    search: <Search size={18} />,
    asc: <ArrowUpWideNarrow size={18} />,
    desc: <ArrowDownWideNarrow size={18} />,
    menu: <EllipsisVertical size={18} />,
    filter: <Filter size={18} />,
    print: <PrinterIcon size={18} />,
    export: <LucideFileJson2 size={18} />,
    right: <ChevronRight size={18} />,
    left: <ChevronLeft size={18} />,
    up: <IoIosArrowUp size={18} />,
    down: <IoChevronDown size={18} />,
    fullscreen: <ExpandIcon size={18} />,
    sort: <SortAsc size={18} />,
    user: <UserCircle2 size={18} />,
    cart: <LucideShoppingCart size={18} />,
    link: <FiLink size={18} />,
    like: <Heart size={18} />,
    login: <LogIn size={18} />,
    logout: <LogOut size={18} />,
    register: <UserPlus2Icon size={18} />,
    alignleft: <AlignLeft size={18} />,
    alignright: <AlignRight size={18} />,
    alignjustify: <AlignJustify size={18} />,
    aligncenter: <AlignCenter size={18} />,
    italic: <FaItalic size={18} />,
    bold: <FaBold size={18} />,
    underline: <GrUnderline size={18} />,
    uppercase: <LuCaseUpper size={18} />,
    lowercase: <RxLetterCaseLowercase size={18} />,
    listul: <FaListUl size={18} />,
    listol: <FaListOl size={18} />,
    strikethrough: <MdOutlineFormatStrikethrough size={18} />,
    table: <FaTableCells size={18} />,
    image: <FaImage size={18} />,
    video: <FaVideo size={18} />,
    draw: <Pencil size={18} />,
    erase: <Eraser size={18} />,
    clear: <GrClear size={18} />,
    undo: <IoIosUndo size={18} />,
    redo: <IoIosRedo size={18} />,
    save: <IoIosSave size={18} />,
    cursor: <GiArrowCursor  size={18} />,
    list: <FaThList   size={18} />,
    grid: <IoGrid   size={18} />,
};
function ImageButton({
                         icon,
                         path,
                         className = "",
                         onClick,
                         children,
                         disabled,
                         label,
                         fontSize,
                         onMouseEnter,
                         onMouseLeave,
                     }: ButtonProps) {
    const IconComponent = iconMap[icon] ?? null;

    if (!IconComponent) {
        console.warn(`Icon "${icon}" not found in iconMap`);
    }

    const content = (
        <div className={`flex items-center gap-2 text-lg ${fontSize}`}>
            {IconComponent}
            {children}
            {label}
        </div>
    );


// inside ImageButton:

    if (path) {
        return (
            <Link
                href={path}
                onClick={onClick}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                className={`px-4 py-2 rounded-md ${className}`}
            >
                {content}
            </Link>
        );
    }



    return (
        <button
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            aria-label={label}
            className={`rounded-md cursor-pointer ${className}`}
            disabled={disabled}
        >
            {content}
        </button>
    );
}

export default ImageButton;
