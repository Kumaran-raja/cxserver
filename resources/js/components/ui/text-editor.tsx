import { useCallback, useEffect, useRef, useState } from "react";
import { Tooltip } from "./tooltip";
import ImageBtn from "./ImageBtn";
import FloatingInput from "./floating-input";

// export default function restoreCursorPosition(container: HTMLElement, offset: number) {
//     const selection = window.getSelection();
//     if (!selection) return;
//
//     let currentOffset = 0;
//     let nodeStack: Node[] = [container]; // ✅ Fix here
//     let node: Node | undefined;
//
//     while ((node = nodeStack.pop())) {
//         if (node.nodeType === Node.TEXT_NODE) {
//             const textLength = node.textContent?.length ?? 0;
//
//             if (currentOffset + textLength >= offset) {
//                 const range = document.createRange();
//                 const position = offset - currentOffset;
//                 range.setStart(node, position);
//                 range.collapse(true);
//                 selection.removeAllRanges();
//                 selection.addRange(range);
//                 return;
//             }
//             currentOffset += textLength;
//         } else {
//             let i = node.childNodes.length;
//             while (i--) nodeStack.push(node.childNodes[i]); // this is now valid
//         }
//     }
// }

export default function TextEditor({
                                       id,
                                       value,
                                       onChange,
                                   }: {
    id: string;
    value: string;
    onChange: (val: string) => void;
}) {

    const [title, setTitle] = useState("");
    const [rawMessage, setRawMessage] = useState("");
    const editorRef = useRef<HTMLDivElement>(null);
    const [isPreviewMode, setIsPreviewMode] = useState(false);

    const [textColor, setTextColor] = useState("#000000");
    const [bgColor, setBgColor] = useState("#ffffff");

    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [isJustifyLeft, setIsJustifyLeft] = useState(false);
    const [isJustifyCenter, setIsJustifyCenter] = useState(false);
    const [isJustifyRight, setIsJustifyRight] = useState(false);
    const [isJustifyFull, setIsJustifyFull] = useState(false);

    const [listMode, setListMode] = useState<"ul" | "ol" | null>(null);
    const [isLineThrough, setIsLineThrough] = useState(false);
    const [showTableDropdown, setShowTableDropdown] = useState(false);
//   const imageInputRef = useRef<HTMLInputElement | null>(null);
//   const videoInputRef = useRef<HTMLInputElement | null>(null);
    const [isFormatting, setIsFormatting] = useState(false);

    useEffect(() => {
        if (isFormatting) return; // 🚫 DO NOT sync while formatting

        if (editorRef.current && value !== editorRef.current.innerHTML) {
            editorRef.current.innerHTML = value || "";
        }
    }, [value, isFormatting]);


    // Function to apply formatting
    const applyFormatting = (
        command: string,
        value?: string,
        persist?: boolean,
        skipSave: boolean = true
    ) => {
        if (!editorRef.current) return;

        setIsFormatting(true); // 🚫 prevent autosave
        editorRef.current.focus();

        const selection = window.getSelection();
        const hasTextSelected = selection && !selection.isCollapsed;

        if (hasTextSelected) {
            document.execCommand(command, false, value);
        } else if (persist) {
            document.execCommand(command, false, value);
        }

        setTimeout(() => {
            setIsFormatting(false); // ✅ allow autosave again (next keystroke)
        }, 0);

        if (skipSave) return;

        onChange(editorRef.current.innerHTML);
        setRawMessage(editorRef.current.innerHTML);
    };



    const toggleBold = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        setIsFormatting(true);

        const selection = window.getSelection();
        const hasTextSelected = selection && !selection.isCollapsed;

        if (hasTextSelected) {
            const newVal = !document.queryCommandState("bold");
            setIsBold(newVal);
            applyFormatting("bold");
        } else {
            const newVal = !isBold;
            setIsBold(newVal);
            applyFormatting("bold", undefined, true);
        }

        setTimeout(() => setIsFormatting(false), 0);
    };



    const toggleItalic = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        const selection = window.getSelection();
        const hasTextSelected = selection && !selection.isCollapsed;

        if (hasTextSelected) {
            const newVal = !document.queryCommandState("italic");
            setIsItalic(newVal);
            applyFormatting("italic");
        } else {
            const newVal = !isItalic;
            setIsItalic(newVal);
            applyFormatting("italic", undefined, true,true);
        }
    };

    const toggleUnderline = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        const selection = window.getSelection();
        const hasTextSelected = selection && !selection.isCollapsed;

        if (hasTextSelected) {
            const newVal = !document.queryCommandState("underline");
            setIsUnderline(newVal);
            applyFormatting("underline");
        } else {
            const newVal = !isUnderline;
            setIsUnderline(newVal);
            applyFormatting("underline", undefined, true);
        }
    };

    const toggleAlignLeft = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setIsJustifyLeft(true);
        setIsJustifyCenter(false);
        setIsJustifyRight(false);
        setIsJustifyFull(false);
        applyFormatting("justifyLeft", undefined, true);
    };

    const toggleAlignCenter = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setIsJustifyLeft(false);
        setIsJustifyCenter(true);
        setIsJustifyRight(false);
        setIsJustifyFull(false);
        applyFormatting("justifyCenter", undefined, true);
    };

    const toggleAlignRight = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setIsJustifyLeft(false);
        setIsJustifyCenter(false);
        setIsJustifyRight(true);
        setIsJustifyFull(false);
        applyFormatting("justifyRight", undefined, true);
    };

    const toggleAlignFull = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setIsJustifyLeft(false);
        setIsJustifyCenter(false);
        setIsJustifyRight(false);
        setIsJustifyFull(true);
        applyFormatting("justifyFull", undefined, true);
    };

    // Helper function to transform selected text (for uppercase/lowercase)
    const transformSelectedText = (
        e: React.MouseEvent<HTMLButtonElement>,
        transformFn: (text: string) => string
    ) => {
        e.preventDefault();
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || !editorRef.current) return;

        const range = selection.getRangeAt(0);
        // Ensure the selection is within our editable div
        if (!editorRef.current.contains(range.commonAncestorContainer)) return;

        if (range.collapsed) return; // no text selected

        const selectedText = range.toString();
        const transformedText = transformFn(selectedText);

        // Replace the selected text. For complex styling, you'd insert a span.
        // For simple text transformation, replacing with a text node is fine.
        range.deleteContents();
        range.insertNode(document.createTextNode(transformedText));

        // After modification, update the rawMessage from the DOM
        setRawMessage(editorRef.current.innerHTML);
        onChange(editorRef.current!.innerHTML);

    };

    const handleUppercase = (e: React.MouseEvent<HTMLButtonElement>) => {
        transformSelectedText(e, (text) => text.toUpperCase());
    };

    const handleLowercase = (e: React.MouseEvent<HTMLButtonElement>) => {
        transformSelectedText(e, (text) => text.toLowerCase());
    };


    const handleTextColorInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const color = e.target.value;
        setTextColor(color);
        applyFormatting("foreColor", color);
    };

    const handleBgColorInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const color = e.target.value;
        setBgColor(color);
        applyFormatting("backColor", color);
    };

    const applyLinkToSelection = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        const url = prompt("Enter the URL:");
        if (!url || !editorRef.current) return;

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        if (!editorRef.current.contains(range.commonAncestorContainer)) return;

        const selectedText = selection.toString();
        if (!selectedText) return;

        // Clean out any existing <a> tags from the selected text
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = selectedText;
        const clean = tempDiv.textContent || tempDiv.innerText || "";

        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        anchor.style.color = "blue";
        anchor.style.textDecoration = "underline";
        anchor.style.cursor = "pointer";
        anchor.textContent = clean;

        range.deleteContents();
        range.insertNode(anchor);

        // Move cursor after the inserted anchor
        range.setStartAfter(anchor);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);

        onChange(editorRef.current!.innerHTML);
        setRawMessage(editorRef.current.innerHTML);
    };

    const handleToggleListMode = (
        e: React.MouseEvent<HTMLButtonElement>,
        type: "ul" | "ol"
    ) => {
        e.preventDefault();
        setListMode((prev) => (prev === type ? null : type));

        if (editorRef.current) {
            const selection = window.getSelection();
            const range = selection?.getRangeAt(0);
            if (!range || !editorRef.current.contains(range.commonAncestorContainer))
                return;

            // Only insert list when activating (not when toggling off)
            if (listMode !== type) {
                const list = document.createElement(type);
                list.style.listStyleType = type === "ul" ? "disc" : "decimal";
                list.style.paddingLeft = "3.5rem";

                const li = document.createElement("li");
                li.appendChild(document.createElement("br")); // placeholder
                list.appendChild(li);

                range.deleteContents();
                range.insertNode(list);

                const newRange = document.createRange();
                newRange.selectNodeContents(li);
                newRange.collapse(true);
                selection?.removeAllRanges();
                selection?.addRange(newRange);

                editorRef.current.focus();
                onChange(editorRef.current!.innerHTML);
                setRawMessage(editorRef.current.innerHTML);
            }
        }
    };

    const handleImage = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (e: any) => {
            const file = e.target.files?.[0];
            if (file) insertMedia(file, "image");
        };
        input.click();
    };

    const handleVideo = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "video/*";
        input.onchange = (e: any) => {
            const file = e.target.files?.[0];
            if (file) insertMedia(file, "video");
        };
        input.click();
    };

    const insertMedia = (file: File, type: "image" | "video") => {
        if (!editorRef.current) return;

        const url = URL.createObjectURL(file);

        let mediaElement: HTMLImageElement | HTMLVideoElement;
        if (type === "image") {
            mediaElement = document.createElement("img");
            mediaElement.src = url;
        } else {
            mediaElement = document.createElement("video");
            mediaElement.src = url;
            mediaElement.controls = true;
        }

        mediaElement.style.maxWidth = "100%";
        mediaElement.style.margin = "0.5rem 0";

        editorRef.current.appendChild(mediaElement);
        editorRef.current.appendChild(document.createElement("br"));
    };
    const handleContentChange = useCallback(() => {
        if (isFormatting) return;   // ⛔ STOP AUTOSAVE during bold/italic clicks

        const editor = editorRef.current;
        if (!editor) return;

        const selection = window.getSelection();
        if (!selection || !selection.rangeCount) return;

        const range = selection.getRangeAt(0);

        // Prevent inserting multiple markers accidentally
        const existingMarker = editor.querySelector("#caret-marker");
        if (existingMarker) existingMarker.remove();

        // Insert temporary caret marker
        const marker = document.createElement("span");
        marker.id = "caret-marker";
        marker.textContent = "\u200B";
        range.insertNode(marker);

        // Save updated HTML
        const newHtml = editor.innerHTML;
        if (newHtml !== rawMessage) {
            setRawMessage(newHtml);
            onChange(newHtml);
            localStorage.setItem(`editor-draft-${id}`, newHtml);
        }

        // Restore caret position after DOM update
        requestAnimationFrame(() => {
            const markerEl = editor.querySelector("#caret-marker");
            if (!markerEl) return;

            const newRange = document.createRange();
            newRange.setStartAfter(markerEl);
            newRange.collapse(true);

            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(newRange);

            // Cleanup
            markerEl.remove();
        });
    }, [rawMessage, id, onChange, isFormatting]);


    useEffect(() => {
        const checkSelection = () => {
            const selection = window.getSelection();
            const editor = editorRef.current;
            if (!selection || !editor) return;

            let node = selection.anchorNode;
            let insideEditor = false;
            while (node) {
                if (node === editor) {
                    insideEditor = true;
                    break;
                }
                node = node.parentNode;
            }

            if (!insideEditor) return;

            // Check formatting on selected content eg:select content already apply any style
            setIsBold(document.queryCommandState("bold"));
            setIsItalic(document.queryCommandState("italic"));
            setIsUnderline(document.queryCommandState("underline"));

            setIsJustifyLeft(document.queryCommandState("justifyLeft"));
            setIsJustifyCenter(document.queryCommandState("justifyCenter"));
            setIsJustifyRight(document.queryCommandState("justifyRight"));
            setIsJustifyFull(document.queryCommandState("justifyFull"));

            setIsLineThrough(document.queryCommandState("strikeThrough"));
        };

        // Listen to selection changes for enabling/disabling buttons
        document.addEventListener("selectionchange", checkSelection);
        document.addEventListener("keyup", checkSelection);
        document.addEventListener("mouseup", checkSelection);

        return () => {
            document.removeEventListener("selectionchange", checkSelection);
            document.removeEventListener("keyup", checkSelection);
            document.removeEventListener("mouseup", checkSelection);
        };
    }, []);

    useEffect(() => {
        if (!isPreviewMode && editorRef.current) {
            editorRef.current.innerHTML = rawMessage;

            // Move caret to end only once, when exiting preview
            const range = document.createRange();
            const selection = window.getSelection();
            range.selectNodeContents(editorRef.current);
            range.collapse(false);
            selection?.removeAllRanges();
            selection?.addRange(range);
        }
    }, [isPreviewMode]);

    const applyFontSize = (pxSize: number) => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        if (range.collapsed) return;

        const span = document.createElement("span");
        span.style.fontSize = `${pxSize}px`;
        span.appendChild(range.extractContents());
        range.insertNode(span);
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        newRange.collapse(false);
        selection.addRange(newRange);
        onChange(editorRef.current!.innerHTML);
        setRawMessage(editorRef.current!.innerHTML);
    };

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (!editorRef.current) return;

            const sel = window.getSelection();
            if (!sel || !sel.rangeCount) return;

            const range = sel.getRangeAt(0);
            const node = range.startContainer as HTMLElement;
            let cell: HTMLElement | null =
                node.nodeType === 3 ? node.parentElement : (node as HTMLElement);

            while (cell && cell.nodeName !== "TD" && cell.nodeName !== "TH") {
                cell = cell.parentElement;
            }
            if (!cell) return;

            const row = cell.parentElement as HTMLTableRowElement;
            const table = row.parentElement?.parentElement as HTMLTableElement;
            if (!table) return;

            const colIndex = Array.from(row.children).indexOf(cell);
            const rowIndex = Array.from(table.rows).indexOf(row);

            const moveFocus = (r: number, c: number) => {
                if (r >= 0 && r < table.rows.length) {
                    const targetRow = table.rows[r];
                    if (c >= 0 && c < targetRow.cells.length) {
                        const targetCell = targetRow.cells[c];
                        const range = document.createRange();
                        range.selectNodeContents(targetCell);
                        range.collapse(true);
                        const sel = window.getSelection();
                        sel?.removeAllRanges();
                        sel?.addRange(range);
                    }
                }
            };

            // 🟢 Enter = insert new line (inside cell)
            if (e.key === "Enter") {
                e.preventDefault();

                const br = document.createElement("br");
                const space = document.createTextNode("\u00A0"); // &nbsp;

                range.deleteContents();
                range.insertNode(br);
                range.collapse(false); // move caret after <br>
                range.insertNode(space);

                const newRange = document.createRange();
                newRange.setStartAfter(space);
                newRange.collapse(true);
                sel.removeAllRanges();
                sel.addRange(newRange);
                return;
            }

            if (e.key === "Enter" && e.shiftKey) {
                //   e.preventDefault();

                const br = document.createElement("br");
                const range = sel.getRangeAt(0);
                range.deleteContents();
                range.insertNode(br);

                // ⬇ Add a zero-width space after <br> to move caret forward
                const zwsp = document.createTextNode("\u200B");
                br.parentNode?.insertBefore(zwsp, br.nextSibling);

                // ⬇ Move caret after the zero-width space
                const newRange = document.createRange();
                newRange.setStartAfter(zwsp);
                newRange.collapse(true);
                sel.removeAllRanges();
                sel.addRange(newRange);
                return;
            }

            // ⏭️ Tab = move to next cell
            if (e.key === "Tab") {
                e.preventDefault();
                const nextCol = colIndex + 1;
                if (nextCol < row.cells.length) {
                    moveFocus(rowIndex, nextCol);
                } else {
                    moveFocus(rowIndex + 1, 0);
                }
            }
        },
        []
    );

    //   focus table cell
    const tableDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                tableDropdownRef.current &&
                !tableDropdownRef.current.contains(e.target as Node)
            ) {
                setShowTableDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Autosave and draft
    useEffect(() => {
        const saved = localStorage.getItem(`editor-draft-${id}`);

        if (saved && editorRef.current) {
            setRawMessage(saved);
            editorRef.current.innerHTML = saved;
            onChange(saved); // sync to parent
        }
    }, [id]);

    useEffect(() => {
        localStorage.setItem("editor-draft", rawMessage);
    }, [rawMessage]);

    const toggleLineThrough = () => {
        const selection = window.getSelection();
        const hasTextSelected = selection && !selection.isCollapsed;

        if (hasTextSelected) {
            const newVal = !document.queryCommandState("strikeThrough");
            setIsLineThrough(newVal);
            applyFormatting("strikeThrough");
        } else {
            const newVal = !isLineThrough;
            setIsLineThrough(newVal);
            applyFormatting("strikeThrough", undefined, true);
        }
    };

    const insertBasicTable = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (!editorRef.current) return;
        const selection = window.getSelection();
        const range = selection?.getRangeAt(0);
        if (!range || !editorRef.current.contains(range.commonAncestorContainer))
            return;

        const table = document.createElement("table");
        table.setAttribute("border", "1");
        table.style.borderCollapse = "collapse";
        table.style.width = "100%";
        table.style.border = "1px solid #ccc";

        const thead = document.createElement("thead");
        const trHead = document.createElement("tr");

        for (let i = 0; i < 3; i++) {
            const th = document.createElement("th");
            th.dataset.row = "0";
            th.dataset.col = i.toString();
            th.textContent = `Header ${i + 1}`;
            th.style.padding = "8px";
            th.style.border = "1px solid #ccc";
            th.style.backgroundColor = "#f1f1f1";
            th.style.fontWeight = "bold";
            th.style.textAlign = "left";
            th.contentEditable = "plaintext-only";
            trHead.appendChild(th);
        }

        // Spacer for control cell
        const controlHeader = document.createElement("th");
        controlHeader.style.width = "60px";
        trHead.appendChild(controlHeader);
        thead.appendChild(trHead);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");

        const createRow = (rowIndex: number) => {
            const tr = document.createElement("tr");

            for (let i = 0; i < 3; i++) {
                const td = document.createElement("td");
                td.dataset.row = rowIndex.toString();
                td.dataset.col = i.toString();
                td.style.padding = "8px";
                td.style.height = "45px";
                td.style.border = "1px solid #ccc";
                td.contentEditable = "plaintext-only";
                tr.appendChild(td);
            }

            // Action buttons cell
            const controlCell = document.createElement("td");
            controlCell.style.width = "60px";
            controlCell.style.border = "1px solid #ccc";
            controlCell.style.textAlign = "center";
            controlCell.style.verticalAlign = "middle";
            controlCell.style.position = "relative";
            controlCell.style.padding = "0";

            const wrapper = document.createElement("div");
            wrapper.style.display = "none";
            wrapper.style.justifyContent = "center";
            wrapper.style.gap = "5px";
            wrapper.style.padding = "6px";

            const addBtn = document.createElement("button");
            addBtn.textContent = "+";
            addBtn.style.cursor = "pointer";
            addBtn.title = "Add Row";
            addBtn.style.background = "none";
            addBtn.style.border = "none";
            addBtn.style.fontSize = "16px";
            addBtn.onclick = () => {
                const newRow = createRow([...tbody.children].length + 1);
                tbody.insertBefore(newRow, tr.nextSibling);
                updateRowIndices();
            };

            const removeBtn = document.createElement("button");
            removeBtn.textContent = "×";
            removeBtn.title = "Remove Row";
            removeBtn.style.cursor = "pointer";
            removeBtn.style.background = "none";
            removeBtn.style.border = "none";
            removeBtn.style.color = "red";
            removeBtn.style.fontSize = "16px";
            removeBtn.onclick = () => {
                if (tbody.children.length > 1) {
                    tr.remove();
                    updateRowIndices();
                } else {
                    alert("At least one row is required.");
                }
            };

            wrapper.appendChild(addBtn);
            wrapper.appendChild(removeBtn);
            controlCell.appendChild(wrapper);
            tr.appendChild(controlCell);

            // Hover to show/hide buttons
            tr.onmouseenter = () => {
                wrapper.style.display = "flex";
            };
            tr.onmouseleave = () => {
                wrapper.style.display = "none";
            };

            return tr;
        };

        // Update row indices
        const updateRowIndices = () => {
            [...tbody.children].forEach((rowEl, rowIndex) => {
                [...rowEl.children].forEach((cellEl, colIndex) => {
                    if (cellEl instanceof HTMLElement) {
                        cellEl.dataset.row = (rowIndex + 1).toString();
                        cellEl.dataset.col = colIndex.toString();
                    }
                });
            });
        };

        // Initial 2 rows
        for (let j = 0; j < 2; j++) {
            tbody.appendChild(createRow(j + 1));
        }

        table.appendChild(tbody);

        table.addEventListener("input", (e) => {
            const target = e.target as HTMLElement;
            if (target.tagName === "TD" || target.tagName === "TH") {
                const row = target.dataset.row;
                const col = target.dataset.col;
                const content = target.textContent;
                console.log(`Cell [${row}, ${col}] changed to:`, content);
            }
        });

        range.deleteContents();
        range.insertNode(table);
        onChange(editorRef.current!.innerHTML);
        setRawMessage(editorRef.current.innerHTML);
    };

    const getSelectedTable = (): HTMLTableElement | null => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return null;

        let node = selection.anchorNode as Node | null;
        while (node) {
            if (
                node.nodeType === Node.ELEMENT_NODE &&
                (node as Element).tagName === "TABLE"
            ) {
                return node as HTMLTableElement;
            }
            node = node.parentNode;
        }
        return null;
    };

    const addRowToSelectedTable = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        const table = getSelectedTable();
        if (!table) return;

        const tbody = table.querySelector("tbody");
        const columns = table.rows[0]?.cells.length || 3;
        const newRow = document.createElement("tr");

        for (let i = 0; i < columns; i++) {
            const td = document.createElement("td");
            td.contentEditable = "true";
            td.style.padding = "8px";
            td.style.height = "45px";
            td.style.border = "1px solid #ccc";
            td.textContent = "";
            td.contentEditable = "plaintext-only";
            newRow.appendChild(td);
        }

        tbody?.appendChild(newRow);
        onChange(editorRef.current!.innerHTML);
        setRawMessage(editorRef.current!.innerHTML);
    };

    const addColToSelectedTable= (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        const table = getSelectedTable();
        if (!table) return;

        const rows = table.rows;
        for (let i = 0; i < rows.length; i++) {
            const cell =
                i === 0 ? document.createElement("th") : document.createElement("td");
            cell.contentEditable = "true";
            cell.textContent = i === 0 ? `Header ${rows[0].cells.length + 1}` : "";
            cell.style.padding = "8px";
            cell.style.border = "1px solid #ccc";
            cell.contentEditable = "plaintext-only";

            if (i === 0) {
                cell.style.backgroundColor = "#f1f1f1";
                cell.style.fontWeight = "bold";
            }

            rows[i].appendChild(cell);
        }

        onChange(editorRef.current!.innerHTML);
        setRawMessage(editorRef.current!.innerHTML);
    };

    const removeTable = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        const table = getSelectedTable();
        if (!table || !editorRef.current) return;

        table.remove();
        onChange(editorRef.current!.innerHTML);
        setRawMessage(editorRef.current.innerHTML);
    };

    const removeLastRowFromSelectedTable = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        const table = getSelectedTable();
        if (!table) return;

        const tbody = table.querySelector("tbody");
        const rowCount = tbody?.rows.length || 0;

        if (rowCount > 0) {
            tbody?.deleteRow(rowCount - 1);
            onChange(editorRef.current!.innerHTML);
            setRawMessage(editorRef.current!.innerHTML);
        }
    };

    const removeLastColFromSelectedTable = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        const table = getSelectedTable();
        if (!table) return;

        const rows = table.rows;
        const colCount = rows[0]?.cells.length || 0;

        if (colCount === 0) return;

        for (let i = 0; i < rows.length; i++) {
            rows[i].deleteCell(colCount - 1);
        }

        setRawMessage(editorRef.current!.innerHTML);
    };

    //   Paste handling

    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            e.preventDefault();
            const text = e.clipboardData?.getData("text/plain") ?? "";
            document.execCommand("insertText", false, text);
        };
        const ref = editorRef.current;
        if (ref) ref.addEventListener("paste", handlePaste);
        return () => ref?.removeEventListener("paste", handlePaste);
    }, []);

    return (
        <div className="flex flex-col text-xl gap-5">
            <div className="flex flex-col gap-3 w-full mx-auto flex-1">
                {/*{!isPreviewMode && (*/}
                {/*    <FloatingInput*/}
                {/*        id="title"*/}
                {/*        label="Title"*/}
                {/*        err=""*/}
                {/*        value={title}*/}
                {/*        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>*/}
                {/*            setTitle(e.target.value)*/}
                {/*        }*/}
                {/*    />*/}
                {/*)}*/}

                <div className="flex justify-between mt-4 gap-5">
                    {!isPreviewMode && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <Tooltip
                                content={"Image"}
                            >
                                <ImageBtn
                                    onClick={toggleBold}
                                    icon="bold"
                                    className={`p-2  hover:bg-gray-300 rounded-md ${
                                        isBold ? "border border-ring/50 bg-foreground/20" : ""
                                    }`}
                                />
                            </Tooltip>
                            <Tooltip
                                content={"Image"}
                            >
                                <ImageBtn
                                    onClick={toggleItalic}
                                    className={`p-2  hover:bg-gray-300 rounded-md ${
                                        isItalic ? "border border-ring/50 bg-foreground/20" : ""
                                    }`}
                                    icon={"italic"}
                                />
                            </Tooltip>
                            <Tooltip
                                content={"Image"}
                            >
                                <ImageBtn
                                    onClick={toggleUnderline}
                                    className={`p-2  hover:bg-gray-300 rounded-md ${
                                        isUnderline
                                            ? "border border-ring/50 bg-foreground/20"
                                            : ""
                                    }`}
                                    icon={"underline"}
                                />
                            </Tooltip>
                            <Tooltip
                                content={"Image"}
                            >
                                <ImageBtn
                                    onClick={handleUppercase}
                                    className={`p-2 hover:bg-gray-300 rounded-md `}
                                    icon={"uppercase"}
                                />
                            </Tooltip>
                            <Tooltip
                                content={"Image"}
                            >
                                <ImageBtn
                                    onClick={handleLowercase}
                                    className={`p-2  hover:bg-gray-300 rounded-md `}
                                    icon={"lowercase"}
                                />
                            </Tooltip>
                            <Tooltip
                                content={"Image"}
                            >
                                <input
                                    type="color"
                                    value={textColor}
                                    onInput={handleTextColorInput}
                                    className="w-6"
                                />
                            </Tooltip>
                            <Tooltip
                                content={"Image"}
                            >
                                <input
                                    type="color"
                                    value={bgColor}
                                    onInput={handleBgColorInput}
                                    className="w-6"
                                />
                            </Tooltip>


                            <select
                                onChange={(e) => {
                                    const size = parseInt(e.target.value);
                                    if (!isNaN(size)) {
                                        applyFontSize(size);
                                        editorRef.current?.focus();
                                    }
                                }}
                                defaultValue=""
                                className={`text-sm border rounded-md px-2 py-1 bg-white`}
                            >
                                <option value="" disabled>
                                    Size
                                </option>
                                <option value="8">8</option>
                                <option value="12">12</option>
                                <option value="16">16</option>
                                <option value="20">20</option>
                                <option value="24">24</option>
                                <option value="28">28</option>
                                <option value="36">36</option>
                                <option value="48">48</option>
                                <option value="72">72</option>
                            </select>

                            <Tooltip
                                content={"Underline"}>
                                <ImageBtn
                                    onClick={toggleAlignLeft}
                                    icon={"alignleft"}
                                    className={`p-2  hover:bg-gray-300 rounded-md ${
                                        isJustifyLeft
                                            ? "border border-ring/50 bg-foreground/20"
                                            : ""
                                    }`}
                                />
                            </Tooltip>
                            <Tooltip
                                content={"Underline"}>
                                <ImageBtn
                                    onClick={toggleAlignCenter}
                                    icon={"aligncenter"}
                                    className={`p-2  hover:bg-gray-300 rounded-md ${
                                        isJustifyCenter
                                            ? "border border-ring/50 bg-foreground/20"
                                            : ""
                                    }`}
                                />
                            </Tooltip>
                            <Tooltip
                                content={"Underline"}>
                                <ImageBtn
                                    onClick={toggleAlignRight}
                                    icon={"alignright"}
                                    className={`p-2 hover:bg-gray-300 rounded-md ${
                                        isJustifyRight
                                            ? "border border-ring/50 bg-foreground/20"
                                            : ""
                                    }`}
                                />
                            </Tooltip>
                            <Tooltip
                                content={"Underline"}>
                                <ImageBtn
                                    onClick={toggleAlignFull}
                                    icon={"alignjustify"}
                                    className={`p-2 hover:bg-gray-300 rounded-md ${
                                        isJustifyFull
                                            ? "border border-ring/50 bg-foreground/20"
                                            : ""
                                    }`}
                                />
                            </Tooltip>
                            <Tooltip
                                content={"Underline"}>
                                <ImageBtn
                                    onClick={applyLinkToSelection}
                                    className={`p-2  hover:bg-gray-300 rounded-md `}
                                    icon={"link"}
                                />
                            </Tooltip>
                            <Tooltip
                                content={"Underline"}>
                                <ImageBtn
                                    onClick={(e) => handleToggleListMode(e, "ul")}
                                    icon={"listul"}
                                    className={`p-2 hover:bg-gray-300 rounded-md ${
                                        listMode === "ul"
                                            ? "border border-ring/50 bg-foreground/20"
                                            : ""
                                    }`}
                                />
                            </Tooltip>
                            <Tooltip
                                content={"Align Left"}
                            >
                                <ImageBtn
                                    onClick={(e) => handleToggleListMode(e, "ol")}
                                    icon={"listol"}
                                    className={`p-2 hover:bg-gray-300 rounded-md ${
                                        listMode === "ol"
                                            ? "border border-ring/50 bg-foreground/20"
                                            : ""
                                    }`}
                                />
                            </Tooltip>
                            <Tooltip
                                content={"Align Center"}
                            >
                                <ImageBtn
                                    onClick={toggleLineThrough}
                                    className={`p-2 hover:bg-gray-300 rounded-md ${
                                        isLineThrough
                                            ? "border border-ring/50 bg-foreground/20"
                                            : ""
                                    }`}
                                    icon={"strikethrough"} // You can set a custom icon name here
                                />
                            </Tooltip>


                            <div
                                className="relative inline-block"
                                onMouseEnter={() => setShowTableDropdown(true)}
                                onMouseLeave={() => setShowTableDropdown(false)}
                            >
                                <ImageBtn
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setShowTableDropdown((prev) => !prev);
                                    }}
                                    className={`p-2 hover:bg-gray-300 rounded-md ${
                                        isLineThrough
                                            ? "border border-ring/50 bg-foreground/20"
                                            : ""
                                    }`}
                                    icon="table"
                                />

                                {showTableDropdown && (
                                    <div
                                        ref={tableDropdownRef}
                                        className="absolute z-10  w-48 bg-white border border-gray-300 shadow-lg rounded-md p-2 text-sm"
                                    >
                                        <button
                                            onClick={insertBasicTable}
                                            className="w-full text-left px-3 py-1 hover:bg-gray-100"
                                        >
                                            Insert Table (3x3)
                                        </button>
                                        <button
                                            onClick={addRowToSelectedTable}
                                            className="w-full text-left px-3 py-1 hover:bg-gray-100"
                                        >
                                            Add Row
                                        </button>
                                        <button
                                            onClick={addColToSelectedTable}
                                            className="w-full text-left px-3 py-1 hover:bg-gray-100"
                                        >
                                            Add Column
                                        </button>
                                        <button
                                            onClick={removeTable}
                                            className="w-full text-left px-3 py-1 hover:bg-gray-100 text-red-600"
                                        >
                                            Remove Table
                                        </button>

                                        <button
                                            onClick={removeLastRowFromSelectedTable}
                                            className="w-full text-left px-3 py-1 hover:bg-gray-100 text-red-500"
                                        >
                                            Remove Row
                                        </button>
                                        <button
                                            onClick={removeLastColFromSelectedTable}
                                            className="w-full text-left px-3 py-1 hover:bg-gray-100 text-red-500"
                                        >
                                            Remove Column
                                        </button>
                                    </div>
                                )}
                            </div>
                            <Tooltip
                                content={"Image"}
                            >
                                <ImageBtn
                                    onClick={handleImage}
                                    icon={"image"}
                                    className={`p-2 hover:bg-gray-300 rounded-md `}
                                />
                            </Tooltip>
                            <Tooltip
                                content={"video"}
                            >
                                <ImageBtn
                                    onClick={handleVideo}
                                    icon={"video"}
                                    className={`p-2 hover:bg-gray-300 rounded-md `}
                                />
                            </Tooltip>

                        </div>
                    )}

                    {isPreviewMode && <div></div>}

                    {/*<div className="flex gap-4 flex-wrap">*/}
                    {/*    <ImageBtn*/}
                    {/*        icon="edit"*/}
                    {/*        label="Write"*/}
                    {/*        onClick={() => setIsPreviewMode(false)}*/}
                    {/*        className={`px-4 p-1 text-sm font-medium transition-colors ${*/}
                    {/*            !isPreviewMode*/}
                    {/*                ? "bg-black text-white"*/}
                    {/*                : "bg-white text-black hover:bg-gray-100"*/}
                    {/*        }`}*/}
                    {/*    />*/}
                    {/*    <ImageBtn*/}
                    {/*        icon="view"*/}
                    {/*        label="Preview"*/}
                    {/*        onClick={() => setIsPreviewMode(true)}*/}
                    {/*        className={`px-4 p-1 text-sm font-medium transition-colors ${*/}
                    {/*            isPreviewMode*/}
                    {/*                ? "bg-black text-white"*/}
                    {/*                : "bg-white text-black hover:bg-gray-100"*/}
                    {/*        }`}*/}
                    {/*    />*/}
                    {/*</div>*/}
                </div>

                {!isPreviewMode && (
                    <div
                        id={id}
                        ref={editorRef} // This ref should now correctly point to the div
                        contentEditable="true"
                        onInput={handleContentChange} // Listen for content changes
                        className="min-h-[300px] p-3 border border-ring/30 rounded overflow-auto focus:outline-none"
                        style={{whiteSpace: "pre-wrap"}}
                        onKeyDown={handleKeyDown}
                    />
                )}
                {isPreviewMode && (
                    <div className="mt-6">
                        <h2 className="font-bold mb-2">Preview:</h2>
                        <div
                            className="p-4 border border-ring/30 rounded bg-gray-50 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: rawMessage }}
                        ></div>
                    </div>
                )}

            </div>
        </div>
    );
}
