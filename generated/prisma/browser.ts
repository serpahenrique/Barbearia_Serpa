/*
 * This file should be your main import to use Prisma-related types and utilities in a browser. 
 * Use it to get access to models, enums, and input types.
 * 
 * This file does not contain a `PrismaClient` class, nor several other helpers that are intended as server-side only.
 * See `client.ts` for the standard, server-side entry point.
 *
 * 🟢 You can import this file directly.
 */

import * as Prisma from './internal/prismaNamespaceBrowser'
export { Prisma }
export * as $Enums from './enums'
export * from './enums';
/**
 * Model Barbeiro
 * 
 */
export type Barbeiro = Prisma.BarbeiroModel
/**
 * Model Cliente
 * 
 */
export type Cliente = Prisma.ClienteModel
/**
 * Model Servico_produto
 * 
 */
export type Servico_produto = Prisma.Servico_produtoModel
/**
 * Model Venda
 * 
 */
export type Venda = Prisma.VendaModel
/**
 * Model Usuario
 * 
 */
export type Usuario = Prisma.UsuarioModel
/**
 * Model Log
 * 
 */
export type Log = Prisma.LogModel
