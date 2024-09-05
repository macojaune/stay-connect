defmodule StayConnectWeb.HomeLive do
  require Logger
  alias StayConnect.{Vote, Release}
  alias StayConnectWeb.{ReleaseListComponent}
  use StayConnectWeb, :live_view
  use Timex

  def mount(_params, _session, socket) do
    socket =
      socket
      |> assign(:weekly, Release.list_weekly())
      |> assign(:daily, Release.list_today())

    {:ok, socket}
  end

  def handle_event("upvote", %{"id" => release_id, "list_type" => list_type}, socket) do
    user = socket.assigns.current_user

    case Vote.upvote_release(user.id, release_id) do
      {:ok, _vote} ->
        if list_type == "weekly" do
          {:noreply, assign(socket, :weekly, Release.list_weekly())}
        else
          {:noreply, assign(socket, :daily, Release.list_today())}
        end

      {:error, _changeset} ->
        Logger.error("error upvote")
        {:noreply, socket}
    end
  end

  def handle_event("downvote", %{"id" => release_id, "list_type" => list_type}, socket) do
    user = socket.assigns.current_user

    case Vote.downvote_release(user.id, release_id) do
      {:ok, _vote} ->
        if list_type == "weekly" do
          {:noreply, assign(socket, :weekly, Release.list_weekly())}
        else
          {:noreply, assign(socket, :daily, Release.list_today())}
        end

      {:error, _changeset} ->
        Logger.error("error downvote")
        {:noreply, socket}
    end
  end

  defp format_date(date) do
    {:ok, formatted} = Timex.lformat(date, "%d %B", "fr", :strftime)
    formatted
  end
  # def assign_daily(socket) do
  #   Logger.info("Socket: #{inspect(socket.assigns.daily)}")
  #   socket |> assign(socket, :daily)
  # end
end
