defmodule StayConnectWeb.ReleaseDetailsLive do
  use StayConnectWeb, :live_view
  alias StayConnect.{Release}

  def mount(params, _session, socket) do
    release = Release.by_id!(params["release_id"])
    socket = socket |> assign(:release, release)
    {:ok, socket}
  end

  def get_featurings(release) do
    Enum.map(release.featurings, fn feat ->
      feat.name
    end)
    |> Enum.join(", ")
  end
end
