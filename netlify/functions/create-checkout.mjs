export default async function (req) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeKey) {
      return new Response(
        JSON.stringify({
          error: "STRIPE_SECRET_KEY manquante dans Netlify."
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const body = await req.json();

    const service = body.service || "non précisé";
    const devis = body.devis || "";

    const siteUrl = new URL(req.url).origin;

    const params = new URLSearchParams();

    params.append("mode", "payment");

    params.append("locale", "fr");

    params.append(
      "success_url",
      `${siteUrl}/?payment=success&session_id={CHECKOUT_SESSION_ID}`
    );

    params.append(
      "cancel_url",
      `${siteUrl}/?payment=cancel`
    );

    params.append(
      "line_items[0][price_data][currency]",
      "eur"
    );

    params.append(
      "line_items[0][price_data][product_data][name]",
      "Estimation Prix Jardin"
    );

    params.append(
      "line_items[0][price_data][product_data][description]",
      `Estimation personnalisée — ${service}`
    );

    params.append(
      "line_items[0][price_data][unit_amount]",
      "999"
    );

    params.append(
      "line_items[0][quantity]",
      "1"
    );

    params.append(
      "metadata[service]",
      String(service)
    );

    params.append(
      "metadata[devis]",
      String(devis)
    );

    const response = await fetch(
      "https://api.stripe.com/v1/checkout/sessions",
      {
        method: "POST",

        headers: {
          "Authorization": `Bearer ${stripeKey}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },

        body: params
      }
    );

    const session = await response.json();

    if (!response.ok) {
      console.error(session);

      return new Response(
        JSON.stringify({
          error: "Stripe n'a pas pu créer le paiement."
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    return new Response(
      JSON.stringify({
        url: session.url
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (error) {

    console.error(error);

    return new Response(
      JSON.stringify({
        error: "Erreur serveur."
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
