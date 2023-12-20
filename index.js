import puppeteer from "puppeteer";
import fs from "fs";

const saveOutput = async (data) => {
  // Сохраняет обрабатанные данные в файл output.json

  const filePath = "output.json";
  fs.writeFileSync(filePath, data, "utf-8");

  console.log(`Data has been saved to ${filePath}`);
};

const productsHandler = (products) => {
  // Обрабатывает данные в нужный формат

  const data = [];

  products.forEach((product) => {
    const newProduct = { art: product.id, stock: {} };

    product.sizes.forEach((size) => {
      newProduct.stock[size.origName] = 0;

      size.stocks.forEach((stock) => {
        newProduct.stock[size.origName] += stock.qty;
      });
    });

    data.push(newProduct);
  });

  saveOutput(JSON.stringify(data));
};

(async () => {
  try {
    let hasProcessedResponse = false;

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setJavaScriptEnabled(true);
    await page.setRequestInterception(true);

    page.on("response", async (response) => {
      // Проврека на то, что первый запрос уже обработан
      if (hasProcessedResponse) {
        await browser.close();
        return;
      }

      // Проверяем URL ответа
      if (response.url().includes("https://card.wb.ru/cards/v1/detail")) {
        // Получаем и отправляет JSON-данные ответа на обработку
        const jsonResponse = await response.json();
        productsHandler(jsonResponse.data.products);

        hasProcessedResponse = true;
      }
    });

    // Настройки для перехвата основного документа
    page.on("request", (request) => {
      request.continue();
    });

    await page.goto("https://www.wildberries.ru/catalog/146972802/detail.aspx");

    await page.waitForResponse(
      (response) => response.url() === "https://card.wb.ru/cards/v1/detail"
    );

    await browser.close();
  } catch (err) {
    console.error(err);
  }
})();
