export default async function (req) {
  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ paid: false }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" }
      }
    );
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
      console.error("Stripe error:", session);

      return new Response(
        JSON.stringify({
          paid: false,
          error: "Impossible de récupérer la session Stripe."
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const paid =
      session.payment_status === "paid" &&
      Number(session.amount_total) === 999 &&
      session.currency === "eur";

    return new Response(
      JSON.stringify({
        paid: paid,
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        }
      }
    );

  } catch (error) {
    console.error("Verification error:", error);

    return new Response(
      JSON.stringify({
        paid: false,
        error: "Erreur lors de la vérification du paiement."
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
