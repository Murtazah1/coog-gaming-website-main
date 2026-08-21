import Leftside from "./leftside-header"
import Rightside from "./rightside-header"

export default function Header() {
  return (
    <div className="mx-3 flex items-center justify-between py-4">
      <Leftside />
      <Rightside />
    </div>
  )
}
