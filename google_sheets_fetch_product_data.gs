// ============================================
// GOOGLE APPS SCRIPT - Aishaura Microgreens API
// Deploy this as a Web App to serve JSON data
// ============================================

// Configuration - ALREADY SET WITH YOUR SHEET ID
const SHEET_ID = '1E-UFMvRf86NJkwyH1Lk_BLP54w1yvGEytgsaJQa4kuA'; // Your Google Sheet ID
const PRODUCTS_SHEET = 'Products';
const REVIEWS_SHEET = 'Reviews';

// ============================================
// HELPER: List all sheets in the spreadsheet
// ============================================
function listAllSheets() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheets = ss.getSheets();
    return sheets.map(sheet => sheet.getName());
  } catch (error) {
    return { error: error.toString() };
  }
}

// Ensure the Products sheet has the expected header row.
// If any expected header is missing or empty, this will populate the header cell.
function ensureProductHeaders(sheet) {
  try {
    const expected = [
      'Product Name', 'Price', 'Image', 'Description', 'Benefits', 'Usage',
      'Original Price', 'Storage', 'Shelf Life', 'Quantity Available'
    ];

    const currentLast = sheet.getLastColumn();
    const checkCols = Math.max(currentLast, expected.length);
    const headerRange = sheet.getRange(1, 1, 1, checkCols);
    const headers = headerRange.getValues()[0] || [];

    // Ensure headers array has at least expected.length entries
    for (let i = 0; i < expected.length; i++) {
      if (!headers[i]) headers[i] = '';
    }

    let changed = false;
    for (let i = 0; i < expected.length; i++) {
      if (!headers[i] || headers[i].toString().trim() === '') {
        headers[i] = expected[i];
        changed = true;
      }
    }

    if (changed) {
      // Write the first expected.length headers back to the sheet
      sheet.getRange(1, 1, 1, expected.length).setValues([headers.slice(0, expected.length)]);
      Logger.log('Headers updated on Products sheet: ' + expected.join(', '));
    }
  } catch (err) {
    Logger.log('ensureProductHeaders error: ' + err.toString());
  }
}

// ============================================
// MAIN API ENDPOINT - Handles all requests
// ============================================
function doGet(e) {
  try {
    const action = e.parameter.action || 'all';
    let response = {};

    // Route to appropriate function based on action parameter
    if (action === 'all') {
      response = getAllData();
    } else if (action === 'products') {
      response = getProducts();
    } else if (action === 'reviews') {
      const productName = e.parameter.product;
      response = getReviewsByProduct(productName);
    } else if (action === 'sheets') {
      // Debug endpoint to list available sheets
      response = { sheets: listAllSheets() };
    } else if (action === 'debug') {
      // Comprehensive debug endpoint
      response = {
        timestamp: new Date().toISOString(),
        sheetId: SHEET_ID,
        productsSheetName: PRODUCTS_SHEET,
        reviewsSheetName: REVIEWS_SHEET,
        availableSheets: listAllSheets(),
        documentAccessible: true
      };
    } else if (action === 'updateQuantity') {
      // Update product quantity after order
      const productName = e.parameter.product;
      const quantityReduction = parseFloat(e.parameter.reduction) || 1;
      response = reduceProductQuantity(productName, quantityReduction);
    } else if (action === 'sheet-debug') {
      // Debug: Show raw sheet data
      response = debugSheetData();
    } else {
      response = { error: 'Invalid action', availableActions: ['all', 'products', 'reviews', 'sheets', 'debug', 'sheet-debug', 'updateQuantity'] };
    }

    // Return JSON response
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString(),
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// GET ALL DATA (Products + Reviews)
// ============================================
function getAllData() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    
    // Check if Products sheet exists (REQUIRED)
    const productsSheet = ss.getSheetByName(PRODUCTS_SHEET);
    
    if (!productsSheet) {
      const availableSheets = listAllSheets();
      return {
        success: false,
        error: `Sheet "${PRODUCTS_SHEET}" not found`,
        availableSheets: availableSheets,
        message: `Please rename your sheet to "${PRODUCTS_SHEET}" or update the script`,
        timestamp: new Date().toISOString()
      };
    }

    // Ensure headers exist and populate missing header names if necessary
    ensureProductHeaders(productsSheet);
    
    // Check if Reviews sheet exists (OPTIONAL)
    const reviewsSheet = ss.getSheetByName(REVIEWS_SHEET);
    const hasReviews = reviewsSheet !== null;

    // Get all values from products sheet
    const productsData = productsSheet.getDataRange().getValues();
    let reviewsData = [];
    
    if (hasReviews) {
      reviewsData = reviewsSheet.getDataRange().getValues();
    }

    const products = {};

    // Parse products (skip header row at index 0)
    for (let i = 1; i < productsData.length; i++) {
      const row = productsData[i];
      if (!row[0] || row[0].toString().trim() === '') break; // Stop at empty rows

      const productName = row[0].toString().trim();
      
      // Expected columns: Product Name | Price | Image | Description | Benefits | Usage
      products[productName] = {
        name: productName,
        price: parseFloat(row[1]) || 0,
        image: row[2] ? row[2].toString().trim() : '',
        description: row[3] ? row[3].toString().trim() : '',
        benefits: parseSemicolonList(row[4] ? row[4].toString() : ''),
        usage: parseSemicolonList(row[5] ? row[5].toString() : ''),
        rating: 0,
        reviews: 0,
        customerReviews: []
      };

      // Add optional fields (columns 7+)
      if (row[6]) products[productName].originalPrice = parseFloat(row[6]) || products[productName].price;
      if (row[7]) products[productName].storage = row[7].toString().trim();
      if (row[8]) products[productName].shelfLife = row[8].toString().trim();
      // IMPORTANT: Handle quantity even if it's 0 (falsy)
      if (row[9] !== undefined && row[9] !== null && row[9] !== '') {
        products[productName].quantityAvailable = row[9].toString().trim();
      } else {
        products[productName].quantityAvailable = '0'; // Default to 0 if not set
      }
    }

    // Parse reviews and attach to products (ONLY if Reviews sheet exists)
    if (hasReviews) {
      for (let i = 1; i < reviewsData.length; i++) {
        const row = reviewsData[i];
        if (!row[0] || row[0].toString().trim() === '') break; // Stop at empty rows

        const productName = row[0].toString().trim();
        
        // Only add if product exists
        if (products[productName]) {
          const review = {
            name: row[1] ? row[1].toString().trim() : 'Anonymous',
            rating: parseFloat(row[2]) || 0,
            text: row[3] ? row[3].toString().trim() : '',
            date: row[4] ? row[4].toString().trim() : 'Recently'
          };

          products[productName].customerReviews.push(review);
          
          // Update review count and rating from sheet if available
          products[productName].reviews = parseFloat(row[5]) || products[productName].customerReviews.length;
          products[productName].rating = parseFloat(row[6]) || calculateAvgRating(products[productName].customerReviews);
        }
      }
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
      count: Object.keys(products).length,
      hasReviews: hasReviews,
      data: products
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      availableSheets: listAllSheets(),
      timestamp: new Date().toISOString()
    };
  }
}

// ============================================
// GET ONLY PRODUCTS (without detailed reviews)
// ============================================
function getProducts() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(PRODUCTS_SHEET);
    
    if (!sheet) {
      const availableSheets = listAllSheets();
      return {
        success: false,
        error: `Sheet "${PRODUCTS_SHEET}" not found`,
        availableSheets: availableSheets,
        timestamp: new Date().toISOString()
      };
    }
    // Ensure headers exist and populate missing header names if necessary
    ensureProductHeaders(sheet);
    
    const data = sheet.getDataRange().getValues();

    const products = {};

    // Parse products (skip header row)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0] || row[0].toString().trim() === '') break;

      const productName = row[0].toString().trim();
      products[productName] = {
        name: productName,
        price: parseFloat(row[1]) || 0,
        image: row[2] ? row[2].toString().trim() : '',
        description: row[3] ? row[3].toString().trim() : '',
        benefits: parseSemicolonList(row[4] ? row[4].toString() : ''),
        usage: parseSemicolonList(row[5] ? row[5].toString() : '')
      };

      // Add optional fields (columns 7+)
      if (row[6]) products[productName].originalPrice = parseFloat(row[6]) || products[productName].price;
      if (row[7]) products[productName].storage = row[7].toString().trim();
      if (row[8]) products[productName].shelfLife = row[8].toString().trim();
      // IMPORTANT: Handle quantity even if it's 0 (falsy)
      if (row[9] !== undefined && row[9] !== null && row[9] !== '') {
        products[productName].quantityAvailable = row[9].toString().trim();
      } else {
        products[productName].quantityAvailable = '0'; // Default to 0 if not set
      }
    }

    return {
      success: true,
      count: Object.keys(products).length,
      data: products
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      availableSheets: listAllSheets(),
      timestamp: new Date().toISOString()
    };
  }
}

// ============================================
// GET REVIEWS FOR SPECIFIC PRODUCT
// ============================================
function getReviewsByProduct(productName) {
  try {
    if (!productName) {
      return { error: 'Product name required' };
    }

    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(REVIEWS_SHEET);
    
    if (!sheet) {
      return {
        success: true,
        product: productName.toString().trim(),
        count: 0,
        message: `${REVIEWS_SHEET} sheet not found - no reviews available`,
        data: []
      };
    }
    
    const data = sheet.getDataRange().getValues();

    const cleanProductName = productName.toString().trim();
    const reviews = [];

    // Find reviews for this product (skip header row)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0] || row[0].toString().trim() === '') break;

      if (row[0].toString().trim() === cleanProductName) {
        reviews.push({
          name: row[1] ? row[1].toString().trim() : 'Anonymous',
          rating: parseFloat(row[2]) || 0,
          text: row[3] ? row[3].toString().trim() : '',
          date: row[4] ? row[4].toString().trim() : 'Recently'
        });
      }
    }

    return {
      success: true,
      product: cleanProductName,
      count: reviews.length,
      data: reviews
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Parse semicolon-separated list into array
 * Example: "High in protein; Rich in vitamin E & B6" 
 * Returns: ["High in protein", "Rich in vitamin E & B6"]
 */
function parseSemicolonList(text) {
  if (!text || text.toString().trim() === '') return [];
  
  return text
    .toString()
    .split(';')
    .map(item => item.trim())
    .filter(item => item.length > 0);
}

/**
 * Calculate average rating from reviews array
 * Returns: Average rating rounded to 1 decimal
 */
function calculateAvgRating(reviews) {
  if (!reviews || reviews.length === 0) return 0;
  
  const sum = reviews.reduce((total, review) => total + (review.rating || 0), 0);
  const avg = sum / reviews.length;
  return Math.round(avg * 10) / 10; // Round to 1 decimal place
}

/**
 * Reduce product quantity after order
 * Finds the product row and subtracts from column J (Quantity Available)
 */
function reduceProductQuantity(productName, reduction) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(PRODUCTS_SHEET);

    if (!sheet) {
      return {
        success: false,
        error: `Sheet "${PRODUCTS_SHEET}" not found`
      };
    }

    const data = sheet.getDataRange().getValues();
    const cleanProductName = productName.toString().trim();
    let productRow = -1;

    // Find the product row
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString().trim() === cleanProductName) {
        productRow = i;
        break;
      }
    }

    if (productRow === -1) {
      return {
        success: false,
        error: `Product "${cleanProductName}" not found`,
        product: cleanProductName
      };
    }

    // Column J is index 9 (Quantity Available)
    const currentQuantity = data[productRow][9] ? parseInt(data[productRow][9]) : 0;
    const newQuantity = Math.max(0, currentQuantity - reduction);

    // Update the quantity cell
    sheet.getRange(productRow + 1, 10).setValue(newQuantity);

    Logger.log(`Updated ${cleanProductName}: ${currentQuantity} -> ${newQuantity}`);

    return {
      success: true,
      product: cleanProductName,
      previousQuantity: currentQuantity,
      newQuantity: newQuantity,
      reduction: reduction,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      product: productName
    };
  }
}

// ============================================
// DEBUG: Show raw sheet data for troubleshooting
// ============================================
function debugSheetData() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(PRODUCTS_SHEET);
    
    if (!sheet) {
      return { error: 'Products sheet not found', availableSheets: listAllSheets() };
    }
    
    const data = sheet.getDataRange().getValues();
    
    // Convert to readable format
    const rawData = [];
    for (let i = 0; i < Math.min(data.length, 10); i++) {
      const row = {};
      row['Row'] = i + 1;
      row['Col A (Name)'] = data[i][0] || '';
      row['Col B (Price)'] = data[i][1] || '';
      row['Col C (Image)'] = data[i][2] ? data[i][2].toString().substring(0, 30) : '';
      row['Col D (Desc)'] = data[i][3] ? data[i][3].toString().substring(0, 30) : '';
      row['Col E (Benefits)'] = data[i][4] ? data[i][4].toString().substring(0, 30) : '';
      row['Col F (Usage)'] = data[i][5] ? data[i][5].toString().substring(0, 30) : '';
      row['Col G (Orig Price)'] = data[i][6] || '';
      row['Col H (Storage)'] = data[i][7] || '';
      row['Col I (Shelf Life)'] = data[i][8] || '';
      row['Col J (Qty)'] = data[i][9] !== undefined ? data[i][9] : 'UNDEFINED';
      rawData.push(row);
    }
    
    return {
      success: true,
      timestamp: new Date().toISOString(),
      totalRows: data.length,
      lastColumn: sheet.getLastColumn(),
      rawData: rawData,
      message: 'Column J should contain quantity - check "Qty" values above'
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Test function - run this to verify the script works
 * Open the Apps Script editor and click "Run" to test
 */
function testAPI() {
  console.log('Testing Google Sheets API...');
  
  const allData = getAllData();
  console.log('All Data Response:', allData);
  
  const products = getProducts();
  console.log('Products Response:', products);
  
  // Test reviews for first product
  if (allData.data && Object.keys(allData.data).length > 0) {
    const firstProduct = Object.keys(allData.data)[0];
    const reviews = getReviewsByProduct(firstProduct);
    console.log(`Reviews for ${firstProduct}:`, reviews);
  }
}
