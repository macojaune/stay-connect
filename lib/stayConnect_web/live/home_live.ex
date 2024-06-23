defmodule StayConnectWeb.HomeLive do
  alias StayConnectWeb.ReleaseListComponent
  use StayConnectWeb, :live_view

  alias StayConnect.Release

  def mount(_params, _session, socket) do
    {:ok, assign(socket, daily: Release.list_today(), weekly: Release.list_weekly())}
  end

  # def assign_daily(socket) do
  #   Logger.info("Socket: #{inspect(socket.assigns.daily)}")
  #   socket |> assign(socket, :daily)
  # end
end
