import { handleContact } from '../../server/contact.js';

export function onRequest({ request, env }) {
  return handleContact(request, env);
}
