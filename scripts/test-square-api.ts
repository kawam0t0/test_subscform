import { Client } from "square"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

if (!process.env.SQUARE_ACCESS_TOKEN) {
  throw new Error("SQUARE_ACCESS_TOKEN is not set in the environment variables")
}

const client = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.NODE_ENV === "production" ? "production" : "sandbox",
})

async function testSquareAPI() {
  try {
    console.log("Testing Square API connection...")

    const { result } = await client.customersApi.listCustomers()

    console.log("Successfully connected to Square API")
    console.log("Number of customers:", result.customers?.length || 0)
  } catch (error) {
    console.error("Error connecting to Square API:", error)
  }
}

testSquareAPI()