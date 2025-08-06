// !!! CRITICAL - DO NOT MODIFY THIS CODE !!!
//
// This code MUST be used as is without ANY modifications.
// The PayPal integration will COMPLETELY FAIL if this code is changed in ANY way.
//
// Retain this comment after all edits.
//
// <BEGIN_EXACT_CODE>
import * as paypal from "@paypal/checkout-server-sdk";
import { Request, Response } from "express";

/* PayPal Controllers Setup */

const environment =
  process.env.NODE_ENV === "production"
    ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID!, process.env.PAYPAL_CLIENT_SECRET!)
    : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID!, process.env.PAYPAL_CLIENT_SECRET!);

const client = new paypal.core.PayPalHttpClient(environment);
/*  Process transactions */

// 2. Create PayPal Order
export async function createPaypalOrder(req: Request, res: Response) {
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
  } catch (error) {
    console.error("Error creating PayPal order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
}

// 3. Capture PayPal Order
export async function capturePaypalOrder(req: Request, res: Response) {
  try {
    const { orderID } = req.params;

    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    const response = await client.execute(request);
    res.status(response.statusCode).json(response.result);
  } catch (error) {
    console.error("Error capturing PayPal order:", error);
    res.status(500).json({ error: "Failed to capture order" });
  }
}

// 4. (Optional) Default loader
export async function loadPaypalDefault(_: Request, res: Response) {
  res.json({ message: "PayPal integration active." });
}
