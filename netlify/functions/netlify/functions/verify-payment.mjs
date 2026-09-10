export default async function (req) {
  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeKey) {
      return new Response(
        JSON.stringify({
          paid: false,
          error: "STRIPE_SECRET_KEY manquante."
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const url = new URL(req.url);
    const sessionId = url.searchParams.get("session_id");

    if (!sessionId) {
      return new Response(
        JSON.stringify({
          paid: false,
          error: "Session Stripe manquante."
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const response = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${stripeKey}`
        }
      }
    );

    const session = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          paid: false,
          error: "Session Stripe introuvable."
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const paid =
      session.payment_status === "paid" &&
      session.amount_total === 999 &&
      session.currency === "eur";

    return new Response(
      JSON.stringify({ paid }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        }
      }
    );

  } catch (error) {

    console.error(error);

    return new Response(
      JSON.stringify({
        paid: false,
        error: "Erreur lors de la vérification."
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
