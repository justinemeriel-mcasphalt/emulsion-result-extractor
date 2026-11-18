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

const ocrText =
    document.getElementById(
        "ocrText"
    );

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
            `${files.length} PDF(s) selected`;
    }
);

//--------------------------------------
// Render PDF Page
//--------------------------------------

async function renderFirstPage(page)
{
    const viewport =
        page.getViewport({
            scale: 5
        });

    previewCanvas.width =
        viewport.width;

    previewCanvas.height =
        viewport.height;

    await page.render({

        canvasContext:
            previewCtx,

        viewport

    }).promise;

    console.log(
        "Canvas Size:",
        previewCanvas.width,
        previewCanvas.height
    );
}

//--------------------------------------
// OCR PDF
//--------------------------------------

extractBtn.addEventListener(
    "click",
    async () => {

        if (files.length === 0)
        {
            alert(
                "Select PDF files first."
            );

            return;
        }

        tableBody.innerHTML = "";

        for (const file of files)
        {
            statusLabel.textContent =
                `Processing ${file.name}`;

            //----------------------------------
            // Load PDF
            //----------------------------------

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

            //----------------------------------
            // Show first PDF in preview
            //----------------------------------

            if (
                tableBody.children.length === 0
            )
            {
                await renderFirstPage(page);
            }

            //----------------------------------
            // Render page to hidden canvas
            //----------------------------------

            const viewport =
                page.getViewport({
                    scale: 5
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

            //----------------------------------
            // OCR Entire Page
            //----------------------------------

            statusLabel.textContent =
                `OCR: ${file.name}`;

            const result =
                await Tesseract.recognize(
                    canvas,
                    "eng"
                );

            //----------------------------------
            // Show OCR text
            //----------------------------------

            ocrText.value =
                result.data.text;

            console.log(
                "Confidence:",
                result.data.confidence
            );

            //----------------------------------
            // Results table
            //----------------------------------

            const sample =
                file.name.replace(
                    /\.pdf$/i,
                    ""
                );

            const row =
                document.createElement(
                    "tr"
                );

            row.innerHTML = `
                <td>${sample}</td>
                <td>${Math.round(result.data.confidence)}%</td>
            `;

            tableBody.appendChild(
                row
            );
        }

        statusLabel.textContent =
            "OCR Complete";
    }
);

//--------------------------------------
// Clipboard Export
//--------------------------------------

copyBtn.addEventListener(
    "click",
    async () => {

        const text =
            ocrText.value;

        await navigator
            .clipboard
            .writeText(text);

        alert(
            "OCR text copied."
        );
    }
);
