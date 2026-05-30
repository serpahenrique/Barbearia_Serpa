/*
  Warnings:

  - Added the required column `categoria` to the `vendas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `vendas` ADD COLUMN `categoria` ENUM('Servico', 'Produto') NOT NULL;
