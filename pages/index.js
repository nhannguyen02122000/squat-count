import Link from 'next/link'

export default function Home() {
  return (
    <div className="main-container">
      <Link href="/collect-data" passHref>
        <button>COLLECT DATA</button>
      </Link>
      <Link href="/create-model" passHref>
        <button>CREATE MODEL</button>
      </Link>
      <Link href="/predict-model" passHref>
        <button>PREDICT MODEL</button>
      </Link>
    </div>
  )
}
