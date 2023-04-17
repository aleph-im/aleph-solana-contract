import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AlephSolanaContract } from "../target/types/aleph_solana_contract";
import { CpiExample } from "../target/types/cpi_example";
import { createFundedWallet } from "./utils/createFundedWallet";
import { assert } from "chai";

type MessageEvent = {
  name: string,
  data: {
    address: anchor.web3.PublicKey,
    msgtype: string,
    msgcontent: string,
  }
}

type MessageSync = {
  name: string,
  data: {
    address: anchor.web3.PublicKey,
    message: string,
  }
}

function isMessageEvent(event: any): event is MessageEvent {
  return event.data.msgtype !== undefined
}

function isSyncEvent(event: any): event is MessageSync {
  return event.data.message !== undefined
}

describe("aleph-solana-contract", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const messages_program = anchor.workspace.AlephSolanaContract as Program<AlephSolanaContract>;
  const cpi_example_program = anchor.workspace.CpiExample as Program<CpiExample>;
  const confirmOptions: anchor.web3.ConfirmOptions = { commitment: "confirmed" };

  it("test do message", async () => {
    const sender = await createFundedWallet(provider, 20);
    const content = { price: 4, name: "brick", sales: 4, token: "brick" };
    const tx = await messages_program.methods
      .doMessage("message_type", JSON.stringify(content))
      .accounts({
        sender: sender.publicKey,
      })
      .signers(
        sender instanceof (anchor.Wallet as any)
          ? []
          : [sender]
      )
      .rpc(confirmOptions);

    const rawTx = await provider.connection.getTransaction(tx, {
      commitment: "confirmed",
    });
    const eventParser = new anchor.EventParser(messages_program.programId, new anchor.BorshCoder(messages_program.idl));
    const events = eventParser.parseLogs(rawTx.meta.logMessages);

    for (let event of events) {
      if (isMessageEvent(event)) {
        console.log(event);
        assert.equal(event.data.address.toString(), sender.publicKey.toString());
        assert.equal(event.data.msgtype, "message_type");
        assert.equal(event.data.msgcontent, JSON.stringify(content));
      }
    }
  });

  it("test do message cpi", async () => {
    const sender = await createFundedWallet(provider, 20);
    const tx = await cpi_example_program.methods
      .initialize()
      .accounts({
        messagesProgram: messages_program.programId,
        signer: sender.publicKey,
      })
      .signers(
        sender instanceof (anchor.Wallet as any)
          ? []
          : [sender]
      )
      .rpc(confirmOptions);

    const rawTx = await provider.connection.getTransaction(tx, {
      commitment: "confirmed",
    });
    const eventParser = new anchor.EventParser(messages_program.programId, new anchor.BorshCoder(messages_program.idl));
    const events = eventParser.parseLogs(rawTx.meta.logMessages);

    for (let event of events) {
      if (isMessageEvent(event)) {
        console.log(event);
        assert.equal(event.data.address.toString(), sender.publicKey.toString());
        assert.equal(event.data.msgtype, "aggregate");
        assert.equal(event.data.msgcontent, "content");
      }
    }
  });

  it("test do emit", async () => {
    const sender = await createFundedWallet(provider, 20);
    const content = { price: 4, name: "brick", sales: 4, token: "brick" };
    const tx = await messages_program.methods
      .doEmit(JSON.stringify(content))
      .accounts({
        sender: sender.publicKey,
      })
      .signers(
        sender instanceof (anchor.Wallet as any)
          ? []
          : [sender]
      )
      .rpc(confirmOptions);

    const rawTx = await provider.connection.getTransaction(tx, {
      commitment: "confirmed",
    });
    const eventParser = new anchor.EventParser(messages_program.programId, new anchor.BorshCoder(messages_program.idl));
    const events = eventParser.parseLogs(rawTx.meta.logMessages);
    for (let event of events) {
      if (isSyncEvent(event)) {
        console.log(event);
        assert.equal(event.data.address.toString(), sender.publicKey.toString());
        assert.equal(event.data.message, JSON.stringify(content));
      }
    }
  });
});