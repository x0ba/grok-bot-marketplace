import { Show, SignInButton, UserButton } from '@clerk/tanstack-react-start'

export default function HeaderUser() {
  return (
    <>
      <Show when="signed-in">
        <UserButton />
      </Show>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button type="button" className="clerk-sign-in">
            Sign in
          </button>
        </SignInButton>
      </Show>
    </>
  )
}
