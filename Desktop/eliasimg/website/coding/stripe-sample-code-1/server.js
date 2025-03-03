// This is your test secret API key.
const stripe = require('stripe')('sk_test_51QP5vhDiRHn1y6KS8FNCG2qVFz7baXDuDkKt60dUdiqo1dLZinPSLMLIJJSNon2IGPd5sk5DoM3WuMxdC0xcvrwj00kSrYbGZU');
const express = require('express');
const app = express();
app.use(express.static('public'));
app.use(express.json()); // Add this to parse JSON request bodies

const YOUR_DOMAIN = 'http://localhost:4242';

// Define your shipping rates
const SHIPPING_RATES = {
  'DE': 'shr_1Qxql6DiRHn1y6KSJyObjdUb', // Standard Germany Shipping
  'EU': 'shr_1QxqjgDiRHn1y6KSy3OZyfNs', // Standard EU Shipping
  'OTHER': 'shr_1QxqkIDiRHn1y6KS9h4jOniO' // Standard International
};

// EU country codes
const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 
  'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 
  'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
];

// Return a boolean indicating whether the shipping details are valid.
function validateShippingDetails(shippingDetails) {
  // You can add more validation logic here if needed
  return true; // Accept all shipping details for now
}

// Return the appropriate shipping rate ID based on the country
function getShippingRateId(country) {
  if (country === 'DE') {
    return SHIPPING_RATES.DE;
  } else if (EU_COUNTRIES.includes(country)) {
    return SHIPPING_RATES.EU;
  } else {
    return SHIPPING_RATES.OTHER;
  }
}

app.post('/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'DE', 'GB', 'FR', 'IT', 'ES'], // Add more countries as needed
      },
      shipping_options: [
        {
          shipping_rate: SHIPPING_RATES.OTHER, // Default to international shipping
        }
      ],
      line_items: [
        {
          // Provide the exact Price ID of the product you want to sell
          price: 'price_1QxVLxDiRHn1y6KSiu0Kg9b4',
          quantity: 1,
        },
      ],
      mode: 'payment',
      return_url: `${YOUR_DOMAIN}/return.html?session_id={CHECKOUT_SESSION_ID}`,
      automatic_tax: {enabled: true},
    });

    res.send({clientSecret: session.client_secret});
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).send({ error: error.message });
  }
});

app.post('/calculate-shipping-options', async (req, res) => {
  const {checkout_session_id, shipping_details} = req.body;
  
  try {
    // Validate the shipping details
    if (!validateShippingDetails(shipping_details)) {
      return res.json({
        type: 'error', 
        message: 'We cannot ship to your address. Please choose a different address.'
      });
    }
    
    // Get the country from shipping details
    const country = shipping_details.address.country;
    
    // Get the appropriate shipping rate ID
    const shippingRateId = getShippingRateId(country);
    
    // Update the Checkout Session with the appropriate shipping rate
    await stripe.checkout.sessions.update(checkout_session_id, {
      shipping_options: [
        {
          shipping_rate: shippingRateId,
        }
      ],
    });
    
    return res.json({
      type: 'object', 
      value: {succeeded: true}
    });
    
  } catch (error) {
    console.error('Error calculating shipping options:', error);
    return res.status(500).json({
      type: 'error',
      message: 'An error occurred while processing your request: ' + error.message
    });
  }
});

app.get('/session-status', async (req, res) => {
  const session = await stripe.checkout.sessions.retrieve(req.query.session_id);

  res.send({
    status: session.status,
    customer_email: session.customer_details?.email || 'No email provided'
  });
});

app.listen(4242, () => console.log('Running on port 4242'));