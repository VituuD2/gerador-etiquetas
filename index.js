const express = require('express');
const PDFDocument = require('pdfkit');
const bwipjs = require('bwip-js');
const fs = require('fs');

const app = express();

// --- Middlewares ---
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));


// --- Funções Auxiliares de Desenho (sem alterações) ---
function drawOuterBorder(doc) {
    doc.rect(5, 5, doc.page.width - 10, doc.page.height - 10).lineWidth(3).stroke();
}
function drawHorizontalLine(doc, y) {
    doc.moveTo(5, y).lineTo(doc.page.width - 5, y).lineWidth(3).stroke();
}
function drawInvertedTitle(doc, text, y) {
    doc.rect(15, y, doc.page.width - 30, 20).fill('black');
    doc.fill('white').font('Helvetica-Bold').fontSize(12).text(text, 15, y + 5, { align: 'center' });
    doc.fill('black');
}

// --- Rota Principal para Gerar a Etiqueta de Forma Dinâmica ---
app.post('/gerar-etiqueta', async (req, res) => {
    try {
        // Objeto de dados montado a partir do seu novo HTML
        const labelData = {
            logoPath: './logo.png',
            entregador: { 
                nome: req.body.entregador_nome, 
                fone: req.body.entregador_fone, 
                id: req.body.entregador_id 
            },
            coletor: { 
                nome: req.body.coletor_nome, 
                fone: req.body.coletor_fone, 
                id: req.body.coletor_id 
            },
            destinatario: {
                nome: req.body.dest_nome,
                // MUDANÇA AQUI: Lendo os novos nomes dos campos do HTML
                rua: req.body.dest_rua,
                bairro: req.body.dest_bairro,
                cep: req.body.dest_cep,
                fone: req.body.dest_fone
            },
            remetente: {
                nome: req.body.remet_nome,
                // MUDANÇA AQUI: Lendo os novos nomes dos campos do HTML
                rua: req.body.remet_rua,
                bairro: req.body.remet_bairro,
                cep: req.body.remet_cep,
                fone: req.body.remet_fone
            },
            barcode: req.body.barcode_text
        };
        
        const doc = new PDFDocument({
            size: [283.46, 425.20], 
            margins: { top: 0, bottom: 0, left: 0, right: 0 }
        });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=etiqueta.pdf');
        doc.pipe(res);

        const pageW = doc.page.width;
        const margin = 15;

        drawOuterBorder(doc);
        drawHorizontalLine(doc, 90);
        drawHorizontalLine(doc, 200);
        drawHorizontalLine(doc, 330);

        // Seção Cabeçalho
        if (fs.existsSync(labelData.logoPath)) {
            doc.image(labelData.logoPath, margin, margin, { width: 70 });
        } else {
            doc.rect(margin, margin, 70, 70).fill('#E0E0E0');
            doc.fill('black').fontSize(8).text('LOGO', margin + 25, margin + 30);
        }
        
        doc.font('Helvetica-Bold').fontSize(11).text('ENTREGADOR', margin + 90, margin + 5);
        doc.font('Helvetica').fontSize(10).text(`${labelData.entregador.id} ${labelData.entregador.nome} ${labelData.entregador.fone}`);
        doc.moveDown(0.8);
        doc.font('Helvetica-Bold').fontSize(11).text('COLETOR');
        doc.font('Helvetica').fontSize(10).text(`${labelData.coletor.id} ${labelData.coletor.nome} ${labelData.coletor.fone}`);

        // Seção Destinatário
        drawInvertedTitle(doc, 'DESTINATÁRIO', 100);
        // MUDANÇA AQUI: Montando a string de endereço com os novos campos
        const enderecoDestinatario = `${labelData.destinatario.rua}\n${labelData.destinatario.bairro}\nCEP: ${labelData.destinatario.cep}\n${labelData.destinatario.fone}`;
        doc.font('Helvetica-Bold').fontSize(12).text(labelData.destinatario.nome, margin, 130);
        doc.font('Helvetica').fontSize(11).text(enderecoDestinatario, margin, doc.y, { lineGap: 2 });
        
        // Seção Código de Barras
        const barcodeBuffer = await bwipjs.toBuffer({
            bcid: 'code128', text: labelData.barcode, scale: 3, height: 15, includetext: false,
        });
        doc.font('Helvetica-Bold').fontSize(14).text(labelData.barcode, 0, 215, { align: 'center' });
        doc.image(barcodeBuffer, (pageW - 180) / 2, 235, { width: 180 });

        // Seção Remetente
        doc.font('Helvetica-Bold').fontSize(12).text('REMETENTE', margin, 340);
        // MUDANÇA AQUI: Montando a string de endereço com os novos campos
        const enderecoRemetente = `${labelData.remetente.rua}\n${labelData.remetente.bairro}\nCEP: ${labelData.remetente.cep}\n${labelData.remetente.fone}`;
        doc.moveDown(0.5);
        doc.font('Helvetica').fontSize(9).text(labelData.remetente.nome, margin, doc.y);
        doc.text(enderecoRemetente, margin, doc.y, { lineGap: 2 });

        doc.end();

    } catch (error) {
        console.error('Erro ao gerar etiqueta:', error);
        res.status(500).send('Ocorreu um erro ao gerar a etiqueta.');
    }
});


// --- Iniciar o Servidor ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    if (PORT === 3000) {
        console.log(`Abra o formulário em http://localhost:${PORT}`);
    }
});