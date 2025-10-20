// Teste do Webhook localmente
// Execute: node test-webhook-local.js

const payload = {
  data: {
    id: "user_test123",
    email_addresses: [{ email_address: "teste@email.com" }],
    first_name: "Teste",
    last_name: "Usuario",
    image_url: null,
    public_metadata: { userType: "professional" }
  },
  type: "user.created"
};

console.log("🧪 Testando webhook...");
console.log("Payload:", JSON.stringify(payload, null, 2));

fetch("http://localhost:3000/api/webhooks/clerk", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "svix-id": "msg_test",
    "svix-timestamp": Math.floor(Date.now() / 1000).toString(),
    "svix-signature": "test-signature"
  },
  body: JSON.stringify(payload)
})
  .then(r => {
    console.log("Status:", r.status);
    return r.text();
  })
  .then(text => {
    console.log("Resposta:", text);
  })
  .catch(err => {
    console.error("Erro:", err.message);
  });
