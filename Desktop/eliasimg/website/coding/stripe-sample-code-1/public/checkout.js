// This is your public test API key.
const stripe = Stripe("pk_test_51QP5vhDiRHn1y6KSTBWC1fAsVHDA0uNdOd9bBhrhAZO4tPRlME6MyvLz6ZSoCcUFqDCeb4OX8QkKYopDQfDRWBEh00nSBKsbYK");

document.addEventListener('DOMContentLoaded', function() {
  initialize();
});

// Create a Checkout Session with dynamic shipping
async function initialize() {
  try {
    // Fetch Checkout Session and retrieve the client secret
    const fetchClientSecret = async () => {
      try {
        const response = await fetch("/create-checkout-session", {
          method: "POST",
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Client secret received:", data.clientSecret ? "Yes" : "No");
        return data.clientSecret;
      } catch (error) {
        console.error("Error fetching client secret:", error);
        throw error;
      }
    };

    // Call your backend to set shipping options
    const onShippingDetailsChange = async (shippingDetailsChangeEvent) => {
      console.log("Shipping details changed:", shippingDetailsChangeEvent);
      const { checkoutSessionId, shippingDetails } = shippingDetailsChangeEvent;
      
      try {
        const response = await fetch("/calculate-shipping-options", {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            checkout_session_id: checkoutSessionId,
            shipping_details: shippingDetails,
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log("Shipping calculation result:", result);
        
        if (result.type === 'error') {
          return { type: "reject", errorMessage: result.message };
        } else {
          return { type: "accept" };
        }
      } catch (error) {
        console.error('Error calculating shipping options:', error);
        return { 
          type: "reject", 
          errorMessage: "An error occurred while calculating shipping. Please try again." 
        };
      }
    };

    console.log("Initializing embedded checkout...");
    
    // Initialize Checkout with shipping calculation
    const checkout = await stripe.initEmbeddedCheckout({
      fetchClientSecret,
      onShippingDetailsChange,
    });

    console.log("Checkout initialized, mounting to DOM...");
    
    // Mount Checkout
    checkout.mount('#checkout');
    console.log("Checkout mounted");
    
  } catch (error) {
    console.error("Initialization error:", error);
    document.querySelector('#checkout').innerHTML = `
      <div class="error-message">
        <p>There was an error initializing the checkout: ${error.message}</p>
        <p>Please check the console for more details.</p>
      </div>
    `;
  }
}   