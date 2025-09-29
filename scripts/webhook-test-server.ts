import { EmailMessage } from "../app/lib/webhook"
import Bun from 'bun'

const server = Bun.serve({
  port: 3001,
  async fetch(request: Request) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 })
    }

    try {
      const data = await request.json() as EmailMessage
      
      console.log("\n=== Webhook Received ===")
      console.log("Event:", request.headers.get("X-Webhook-Event"))
      console.log("Received At:", data.receivedAt)
      console.log("\nEmail Details:")
      console.log("From:", data.fromAddress)
      console.log("To:", data.toAddress)
      console.log("Subject:", data.subject)
      console.log("Raw Content:", data.content)
      console.log("HTML Content:", data.html)
      console.log("Message ID:", data.messageId)
      console.log("Email ID:", data.emailId)
      console.log("=== End ===\n")

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      })
    } catch (error) {
      console.error("Error processing webhook:", error)
      return new Response(
        JSON.stringify({ error: "Invalid request" }), 
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      )
    }
  },
})

console.log(`Webhook test server listening on http://localhost:${server.port}`) 