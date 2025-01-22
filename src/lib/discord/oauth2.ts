/**
 * @fileoverview Discord OAuth2 Utils
 *
 * ### Functions:
 * - handler for login request
 * - handler for callback request
 * - handler for logout request (revoke token)
 * - handler for refresh request
 * - handler for GET user data
 * - handler for GET user guilds
 * - handler for GET guild member data
 */

import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';

const rest = new REST({ version: 'v10', authPrefix: 'Bearer', userAgentAppendix: 'SupportMailV2' });

export async function loginHandler() {
  // Create state token, store it in cache (default is `true`), optionally store redirect url in node-cache
  // Redirect to Discord OAuth2 login page
}


export async function callbackHandler() {
  // Verify state token, remove it from cache
  // Exchange code for token
  // Store token in cache, set cookie
  // Redirect to server-select page or redirect url
}


export async function logoutHandler() {
  // Revoke token, remove it from cache
  // Clear cookie
  // Redirect to home page
}


export async function refreshHandler() {
  // Get refresh token from cache
  // Exchange refresh token for new token
  // Store new token in cache, set cookie
  // Return new token
}


export async function getUserData() {
  // Get user data from API
  // Set user data in cache for 15 seconds
  // Return user data
}


export async function getUserGuilds() {
  // Get user guilds from API
  // Set guilds in cache for 15 seconds
  // Return guilds
}


export async function getGuildMemberData() {
  // Get member data from API
  // Set member data in cache for 15 seconds
  // Return member data
}
