use anchor_lang::{
    prelude::*,
    solana_program::{
        instruction::Instruction,
        program::invoke
    },
    InstructionData,
};

declare_id!("83eRytbwtuAdVyakF6DVyMHtUxQRNKDjtped19pVJMSc");

#[program]
pub mod cpi_example {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        invoke(
            &Instruction {
                program_id: ctx.accounts.messages_program.key(),
                accounts: vec![
                    AccountMeta::new(ctx.accounts.signer.key(), true), 
                    AccountMeta::new_readonly(ctx.accounts.messages_program.key(), false)
                ],
                data: aleph_solana_contract::instruction::DoMessage {
                    msgtype: "aggregate".to_string(),
                    msgcontent: "content".to_string(),
                }
                .data(),
            },
            &[
                ctx.accounts.signer.to_account_info().clone(),
                ctx.accounts.messages_program.to_account_info().clone(),
            ],
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    /// CHECK: aleph_solana_contract::ID
    #[account(address = aleph_solana_contract::ID, executable)]
    pub messages_program: UncheckedAccount<'info>,
    #[account(mut)]
    pub signer: Signer<'info>,
}
