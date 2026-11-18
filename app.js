pdfjsLib.GlobalWorkerOptions.workerSrc =
'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const upload =
    document.getElementById("pdfUpload");

const extractBtn =
    document.getElementById("extractBtn");

const copyBtn =
    document.getElementById("copyBtn");

const statusLabel =
    document.getElementById("status");

const tableBody =
    document.querySelector(
        "#resultsTable tbody"
    );

const previewCanvas =
    document.getElementById(
        "previewCanvas"
    );

const previewCtx =
    previewCanvas.getContext("2d");

let files = [];

//--------------------------------------
// File Upload
//--------------------------------------

upload.addEventListener(
    "change",
    (e) => {

        files =
            Array.from(
                e.target.files
            );

        statusLabel.textContent =
            `${files.length} file(s) loaded`;
    }
);

//--------------------------------------
// OCR Helper
//--------------------------------------
async function renderPreview(page)
{
    console.log(
    "Preview Size:",
    previewCanvas.width,
    previewCanvas.height
);  
    const viewport =
        page.getViewport({
            scale: 3
        });

    previewCanvas.width =
        viewport.width;

    previewCanvas.height =
        viewport.height;

    await page.render({
        canvasContext: previewCtx,
        viewport
    }).promise;

    drawTemplateBoxes();
}

previewCtx.strokeStyle = "yellow";

previewCtx.beginPath();
previewCtx.moveTo(
    previewCanvas.width / 2,
    0
);

previewCtx.lineTo(
    previewCanvas.width / 2,
    previewCanvas.height
);

previewCtx.stroke();

previewCtx.beginPath();

previewCtx.moveTo(
    0,
    previewCanvas.height / 2
);

previewCtx.lineTo(
    previewCanvas.width,
    previewCanvas.height / 2
);

previewCtx.stroke();

    const result =
        await Tesseract.recognize(
            crop,
            "eng",
            {
                tessedit_pageseg_mode: 7,

                tessedit_char_whitelist:
                    field.whitelist
            }
        );

    return result.data.text
        .replace(/[^\d.]/g, "")
        .trim();
}

    Object.entries(
        PSV_TEMPLATE
    ).forEach(
        ([name, field]) =>
    {

        const x =
            field.x1 *
            previewCanvas.width;

        const y =
            field.y1 *
            previewCanvas.height;

        const width =
            (field.x2 - field.x1)
            * previewCanvas.width;

        const height =
            (field.y2 - field.y1)
            * previewCanvas.height;

        previewCtx.strokeStyle =
            colours[name];

        previewCtx.lineWidth = 4;

        previewCtx.strokeRect(
            x,
            y,
            width,
            height
        );

        previewCtx.fillStyle =
            colours[name];

        previewCtx.font =
            "24px Arial";

        previewCtx.fillText(
            name,
            x,
            y - 10
        );
    });
}

//--------------------------------------
// Main Extraction
//--------------------------------------

extractBtn.addEventListener(
    "click",
    async () => {

        if (files.length === 0) {
            alert("Select a PDF first.");
            return;
        }

        const file = files[0];

        statusLabel.textContent =
            `Running OCR on ${file.name}`;

        const bytes =
            await file.arrayBuffer();

        const pdf =
            await pdfjsLib
            .getDocument({
                data: bytes
            })
            .promise;

        const page =
            await pdf.getPage(1);

        const viewport =
            page.getViewport({
                scale: 5
            });

        previewCanvas.width =
            viewport.width;

        previewCanvas.height =
            viewport.height;

        await page.render({
            canvasContext: previewCtx,
            viewport
        }).promise;

        const result =
            await Tesseract.recognize(
                previewCanvas,
                "eng"
            );

        document.getElementById(
            "ocrText"
        ).value =
            result.data.text;

        console.log(
            result.data.text
        );

        statusLabel.textContent =
            "OCR Complete";
    }
);

            const page =
                await pdf.getPage(1);

            if (tableBody.children.length === 0)
            {
                await renderPreview(page);
            }

            const viewport =
                page.getViewport({
                    scale: 3
                });

            const canvas =
                document.createElement(
                    "canvas"
                );

            canvas.width =
                viewport.width;

            canvas.height =
                viewport.height;

            const ctx =
                canvas.getContext("2d");

            await page.render({

                canvasContext: ctx,

                viewport

            }).promise;

            ctx.strokeStyle = "red";
            ctx.lineWidth = 3;
            
            Object.values(PSV_TEMPLATE)
            .forEach(field => {
            
                const x =
                    field.x1 * canvas.width;
            
                const y =
                    field.y1 * canvas.height;
            
                const width =
                    (field.x2 - field.x1)
                    * canvas.width;
            
                const height =
                    (field.y2 - field.y1)
                    * canvas.height;
            
                ctx.strokeRect(
                    x,
                    y,
                    width,
                    height
                );
            });

            const result =
                await Tesseract.recognize(
                    canvas,
                    "eng",
                    {
                        tessedit_pageseg_mode: 1
                    }
                );

            document
    .getElementById("ocrText")
    .value =
        result.data.text;

            const sample =
                file.name.replace(
                    /\.pdf$/i,
                    ""
                );

            const row =
                document.createElement("tr");

            row.innerHTML = `
                <td>${sample}</td>
                <td>${salbolt}</td>
                <td>${sieve}</td>
                <td>${residue}</td>
            `;

            tableBody
                .appendChild(row);
        }

        statusLabel.textContent =
            "Extraction Complete";
    }
);

//--------------------------------------
// Clipboard Export
//--------------------------------------

copyBtn.addEventListener(
    "click",
    async () => {

        let output =
            "Sample\tSalbolt\tSieve\tResidue\n";

        const rows =
            document.querySelectorAll(
                "#resultsTable tbody tr"
            );

        rows.forEach(
            row => {

                const cells =
                    row.querySelectorAll("td");

                const values =
                    Array.from(cells)
                        .map(
                            x => x.textContent
                        );

                output +=
                    values.join("\t")
                    + "\n";
            }
        );

        await navigator.clipboard
            .writeText(output);

        alert(
            "Copied to clipboard"
        );
    }
);
