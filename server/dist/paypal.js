"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaypalOrder = createPaypalOrder;
exports.capturePaypalOrder = capturePaypalOrder;
exports.loadPaypalDefault = loadPaypalDefault;
// !!! CRITICAL - DO NOT MODIFY THIS CODE !!!
//
// This code MUST be used as is without ANY modifications.
// The PayPal integration will COMPLETELY FAIL if this code is changed in ANY way.
//
// Retain this comment after all edits.
//
// <BEGIN_EXACT_CODE>
const paypal = __importStar(require("@paypal/checkout-server-sdk"));
/* PayPal Controllers Setup */
const environment = process.env.NODE_ENV === "production"
    ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
    : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);
const client = new paypal.core.PayPalHttpClient(environment);
/*  Process transactions */
// 2. Create PayPal Order
async function createPaypalOrder(req, res) {
    try {
        const { amount, currency, intent } = req.body;
        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            return res.status(400).json({ error: "Invalid amount." });
        }
        if (!currency || typeof currency !== "string") {
            return res.status(400).json({ error: "Currency is required." });
        }
        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({
            intent: intent || "CAPTURE",
            purchase_units: [
                {
                    amount: {
                        currency_code: currency,
                        value: amount,
                    },
                },
            ],
        });
        const response = await client.execute(request);
        res.status(response.statusCode).json(response.result);
    }
    catch (error) {
        console.error("Error creating PayPal order:", error);
        res.status(500).json({ error: "Failed to create order" });
    }
}
// 3. Capture PayPal Order
async function capturePaypalOrder(req, res) {
    try {
        const { orderID } = req.params;
        const request = new paypal.orders.OrdersCaptureRequest(orderID);
        request.requestBody({});
        const response = await client.execute(request);
        res.status(response.statusCode).json(response.result);
    }
    catch (error) {
        console.error("Error capturing PayPal order:", error);
        res.status(500).json({ error: "Failed to capture order" });
    }
}
// 4. (Optional) Default loader
async function loadPaypalDefault(_, res) {
    res.json({ message: "PayPal integration active." });
}
