defmodule StayConnect.Repo do
  use Ecto.Repo,
    otp_app: :stayConnect,
    adapter: Ecto.Adapters.SQLite3
end
